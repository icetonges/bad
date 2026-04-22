-- ============================================================
-- fedAnalyst schema for Neon Postgres
-- pgvector with 768-dim embeddings (Gemini text-embedding-004)
-- No auth dependency — public/shared app with workspace scoping
-- ============================================================

create extension if not exists vector;
create extension if not exists "uuid-ossp";

-- ---------- Workspaces (for future multi-tenancy) ----------
create table if not exists public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

insert into public.workspaces (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Default')
on conflict (id) do nothing;

-- ---------- Documents ----------
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null default '00000000-0000-0000-0000-000000000001' references public.workspaces,
  category text not null check (category in ('budget','audit','accounting','contracts')),
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  storage_url text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists documents_workspace_idx on public.documents(workspace_id);
create index if not exists documents_category_idx on public.documents(category);

-- ---------- Chunks + embeddings ----------
create table if not exists public.chunks (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.documents on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(768),
  created_at timestamptz default now()
);
create index if not exists chunks_document_idx on public.chunks(document_id);
create index if not exists chunks_embedding_idx on public.chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ---------- Chat sessions & messages ----------
create table if not exists public.chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null default '00000000-0000-0000-0000-000000000001' references public.workspaces,
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
  workspace_id uuid not null default '00000000-0000-0000-0000-000000000001' references public.workspaces,
  skill_id text not null,
  category text not null check (category in ('budget','audit','accounting','contracts')),
  title text not null,
  content text not null,
  artifacts jsonb default '{}'::jsonb,
  source_documents uuid[],
  created_at timestamptz default now()
);
create index if not exists reports_workspace_idx on public.reports(workspace_id);

-- ---------- Vector search function ----------
create or replace function public.match_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_document_ids uuid[] default null,
  filter_workspace_id uuid default '00000000-0000-0000-0000-000000000001'
)
returns table (
  id uuid,
  document_id uuid,
  filename text,
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
    d.filename,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.chunks c
  join public.documents d on d.id = c.document_id
  where (filter_document_ids is null or c.document_id = any(filter_document_ids))
    and d.workspace_id = filter_workspace_id
    and c.embedding is not null
    and 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;
