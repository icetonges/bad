-- ============================================================
-- fedAnalyst initial schema
-- Enable pgvector, create tables, set RLS
-- ============================================================

create extension if not exists vector;
create extension if not exists "uuid-ossp";

-- ---------- Documents ----------
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  category text not null check (category in ('budget','audit','accounting','contracts')),
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  storage_path text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists documents_user_idx on public.documents(user_id);
create index if not exists documents_category_idx on public.documents(category);

-- ---------- Chunks + embeddings ----------
create table if not exists public.chunks (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.documents on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(1024),
  created_at timestamptz default now()
);
create index if not exists chunks_document_idx on public.chunks(document_id);
create index if not exists chunks_embedding_idx on public.chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ---------- Chat sessions & messages ----------
create table if not exists public.chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  category text check (category in ('budget','audit','accounting','contracts')),
  title text default 'New conversation',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.chat_sessions on delete cascade,
  role text not null check (role in ('user','assistant','system','tool')),
  content text not null,
  tool_calls jsonb,
  created_at timestamptz default now()
);
create index if not exists messages_session_idx on public.chat_messages(session_id);

-- ---------- Generated reports ----------
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  skill_id text not null,
  category text not null check (category in ('budget','audit','accounting','contracts')),
  title text not null,
  content text not null,
  artifacts jsonb default '{}'::jsonb,
  source_documents uuid[],
  created_at timestamptz default now()
);
create index if not exists reports_user_idx on public.reports(user_id);

-- ---------- Vector search function ----------
create or replace function public.match_chunks (
  query_embedding vector(1024),
  match_threshold float,
  match_count int,
  filter_document_ids uuid[] default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    c.id,
    c.document_id,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.chunks c
  where (filter_document_ids is null or c.document_id = any(filter_document_ids))
    and c.embedding is not null
    and 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ---------- Row-level security ----------
alter table public.documents enable row level security;
alter table public.chunks enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.reports enable row level security;

create policy "users see own documents" on public.documents
  for all using (auth.uid() = user_id);

create policy "users see chunks of own documents" on public.chunks
  for all using (exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid()));

create policy "users see own sessions" on public.chat_sessions
  for all using (auth.uid() = user_id);

create policy "users see messages in own sessions" on public.chat_messages
  for all using (exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = auth.uid()));

create policy "users see own reports" on public.reports
  for all using (auth.uid() = user_id);

-- ---------- Storage bucket ----------
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
  on conflict (id) do nothing;

create policy "users upload to own folder" on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users read own files" on storage.objects for select
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users delete own files" on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
