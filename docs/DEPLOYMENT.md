# Deployment

Step-by-step from fresh clone to production on Vercel with Neon + Gemini/Groq + Blob.

## You already have most of this

Since aimlgov.vercel.app is working, you have:
- Vercel account with a project linked to a GitHub repo
- Neon project with `DATABASE_URL`, `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` set
- Google AI Studio API key (`GOOGLE_API_KEY`)
- Groq API key (`GROQ_API_KEY`)

What's new for this app:
- A separate Vercel project for fedAnalyst (or overwrite aimlgov)
- Run the SQL migration against your existing Neon database (safe — tables are prefixed and won't collide unless aimlgov already has `documents`, `chunks`, etc.)
- Create a Vercel Blob store (free tier: 500MB)

## 1. Initialize the repo

```bash
cd fedanalyst
git init
git add .
git commit -m "Initial scaffold"
gh repo create fedanalyst --private --source=. --remote=origin --push
```

Or manually:
```bash
git remote add origin git@github.com:<you>/fedanalyst.git
git branch -M main
git push -u origin main
```

## 2. Provision Vercel Blob

1. Go to Vercel dashboard → Storage → Create → Blob
2. Name it (e.g., `fedanalyst-documents`)
3. Copy `BLOB_READ_WRITE_TOKEN` (starts with `vercel_blob_rw_`)

Free tier: 500 MB storage + 5 GB bandwidth/month. More than enough for an MVP.

## 3. Apply the schema to Neon

**Check first if your existing Neon database already has conflicting tables:**

```sql
-- Run this in Neon SQL editor
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('documents','chunks','chat_sessions','chat_messages','reports','workspaces');
```

If anything conflicts with your aimlgov app, either:
- **Easier:** create a separate Neon database on the same project (Neon → Databases → New)
- **More control:** move fedAnalyst's tables to their own schema by wrapping the migration in `create schema fedanalyst; set search_path to fedanalyst;`

Assuming no conflicts:

```bash
# From local
cp .env.example .env.local
# Fill in DATABASE_URL (pooled URL from Neon)
npm install
npm run db:migrate
```

You should see:
```
Applying 1 migration(s) to <your-neon-host>
  → 001_init.sql
✓ Migrations complete
```

Verify in Neon SQL editor:
```sql
select count(*) from public.workspaces;   -- should be 1
\dx                                        -- should show vector and uuid-ossp extensions
```

## 4. Local test

```bash
npm run dev
```

Open http://localhost:3000 → go to `/dashboard/budget` → upload a small PDF.

Expected flow:
1. File uploads to Vercel Blob (check your Blob dashboard — you should see it appear)
2. Text is extracted, chunked, embedded via Gemini, inserted into Neon
3. Chunk count appears next to the filename

Then go to `/dashboard/chat?category=budget` and ask a question. You should see:
- A `provider` event naming the model (Gemini 2.5 Flash Lite if your Google key is good)
- A `tool_call` for `retrieve_chunks`
- A `tool_result` with retrieved passages
- Streamed answer text

## 5. Deploy to Vercel

### Option A — CLI

```bash
npm install -g vercel
vercel link
```

Pick "link to existing project" if you want to replace aimlgov, or create a new one.

Set environment variables — copy from your existing aimlgov project where they apply:

```bash
# Copy these from aimlgov
vercel env add DATABASE_URL
vercel env add PGHOST
vercel env add PGUSER
vercel env add PGPASSWORD
vercel env add PGDATABASE
vercel env add GOOGLE_API_KEY
vercel env add GROQ_API_KEY

# New for fedAnalyst
vercel env add BLOB_READ_WRITE_TOKEN

# Optional
vercel env add RESEND_API_KEY
vercel env add CONTACT_TO_EMAIL
vercel env add NEXT_PUBLIC_SITE_URL   # set to your Vercel URL after first deploy
```

Then deploy:

```bash
vercel deploy --prod
```

### Option B — Vercel dashboard

1. New Project → Import from GitHub → pick `fedanalyst`
2. In Settings → Environment Variables, add each variable above (Production + Preview scopes)
3. Click Deploy

## 6. Smoke test production

Once deployed, visit your Vercel URL. Upload a document, run a chat query. Check Vercel logs (Observability → Logs) for any errors.

Common gotchas:
- **"GOOGLE_API_KEY not set"** — check the env var scope includes Production
- **"function exceeded maximum duration"** — embedding a large PDF can take >60s on cold start. Hobby plan limits to 60s. Either upgrade to Pro (300s) or reduce the chunk batch size in `app/api/upload/route.ts` and increase upload-time tolerance
- **"relation does not exist"** — the migration wasn't applied to the production database. Re-run `npm run db:migrate` with the production `DATABASE_URL` in `.env.local`
- **Blob upload 403** — wrong `BLOB_READ_WRITE_TOKEN` or Blob store not provisioned in the same Vercel project

## 7. Custom domain (optional)

Vercel dashboard → Settings → Domains → Add. Configure DNS as Vercel instructs. Update `NEXT_PUBLIC_SITE_URL` to match.

## 8. Daily input automation (optional)

Add to `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/daily-ingest", "schedule": "0 6 * * *" }
  ]
}
```

Create `app/api/cron/daily-ingest/route.ts` that:
1. Verifies `Authorization: Bearer <CRON_SECRET>` header
2. Pulls new documents from your source (RSS, S3, SharePoint, agency API)
3. Runs the same chunk/embed pipeline as `/api/upload`

Vercel Cron Hobby tier: 2 scheduled jobs max. Pro: unlimited.

## 9. Observability

Free built-ins:
- Vercel → Observability → Logs (1-hour retention on Hobby)
- Neon → Monitoring → connections, query performance
- Blob dashboard → storage used, bandwidth

Production recommendations:
- Add `@vercel/analytics`
- Log agent tool calls to a dedicated `agent_audit` table for compliance trail
- Consider Sentry for error tracking

## 10. Scaling notes

- **Gemini free tier:** 15 req/min, 1M tokens/day. Beyond that, billed at ~$0.075/M input tokens for Flash Lite — still extremely cheap
- **Groq free tier:** Very generous but rate-limited per minute. The waterfall means if Groq throttles, you're still up on Gemini
- **Neon free tier:** 0.5 GB storage, auto-suspends after 5 minutes idle (acceptable for an MVP; first query after suspension has ~1s cold start)
- **pgvector index:** ivfflat with 100 lists works up to ~100k chunks. Beyond that, switch to HNSW:
  ```sql
  drop index chunks_embedding_idx;
  create index chunks_embedding_idx on public.chunks
    using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);
  ```

## Rollback

If something breaks, rollback is one Vercel dashboard click → Deployments → pick a previous successful deploy → Promote to Production. The database schema is additive (no destructive migrations in this scaffold), so rollbacks are safe.
