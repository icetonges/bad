# Deployment

Step-by-step from a fresh clone to a production URL.

## Prerequisites

- GitHub account
- Vercel account (hobby tier is fine to start)
- Supabase account (free tier OK for small workloads)
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))
- Voyage AI API key ([dash.voyageai.com](https://dash.voyageai.com)) — or OpenAI
- Resend API key ([resend.com](https://resend.com)) — or Gmail app password

## 1. Initialize the repo

```bash
cd fedanalyst
git init
git add .
git commit -m "Initial scaffold"
gh repo create fedanalyst --private --source=. --remote=origin --push
```

If you don't have the GitHub CLI, create the repo manually at github.com and push:

```bash
git remote add origin git@github.com:<you>/fedanalyst.git
git branch -M main
git push -u origin main
```

## 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com). Pick a region close to your users. Save the database password — you will need it for CLI access later.
2. Wait for the project to provision (~2 minutes)
3. Open the SQL editor and paste the contents of `supabase/migrations/20260422000000_init.sql`
4. Run it. You should see tables `documents`, `chunks`, `chat_sessions`, `chat_messages`, `reports` and a `documents` storage bucket
5. Go to Project Settings → API and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret)

### Configure Auth

- Authentication → Providers → Email: enable email/password
- Optionally enable Google OAuth: add the OAuth client ID and secret from Google Cloud Console

### pgvector index

After you have ingested ~1,000 chunks, re-analyze the ivfflat index:

```sql
analyze public.chunks;
```

For larger corpora (~100k+ chunks), switch to HNSW:

```sql
drop index chunks_embedding_idx;
create index chunks_embedding_idx on public.chunks
  using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);
```

## 3. Deploy to Vercel

### Option A — CLI

```bash
npm install -g vercel
vercel link     # link to a new Vercel project
vercel env add  # interactively add each env var for Production, Preview, Development
vercel deploy --prod
```

### Option B — Dashboard

1. Go to vercel.com → New Project → Import from GitHub
2. Select the repo. Framework preset will auto-detect Next.js
3. Before the first deploy, go to Settings → Environment Variables and add everything from `.env.example` (Production + Preview scopes)
4. Deploy

### Environment variables required

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `ANTHROPIC_MODEL` | `claude-opus-4-7` (recommended) or `claude-sonnet-4-6` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server-only) |
| `VOYAGE_API_KEY` | Voyage AI key (or use `OPENAI_API_KEY` instead) |
| `EMBEDDING_MODEL` | `voyage-3-large` (or `text-embedding-3-large` for OpenAI) |
| `RESEND_API_KEY` | Resend API key |
| `CONTACT_TO_EMAIL` | Where contact form submissions go |
| `CONTACT_FROM_EMAIL` | Sender address (must be a verified Resend domain) |
| `MCP_SERVERS` | Optional. Comma-separated MCP server commands |
| `NEXT_PUBLIC_SITE_URL` | `https://yourapp.vercel.app` after first deploy |

## 4. Configure Resend (if using)

1. Sign up at [resend.com](https://resend.com)
2. Add and verify a domain (or use Resend's testing address during dev)
3. Create an API key
4. Set `CONTACT_FROM_EMAIL` to an address on your verified domain

### Gmail alternative

If you prefer Gmail:

1. Enable 2FA on the Gmail account
2. Create an app password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` in Vercel env
4. `npm install nodemailer` (not in default `package.json` — add if using Gmail path)

## 5. Test the deploy

1. Visit your Vercel URL
2. Sign up at `/login`. Check your email for the confirmation link. Click it
3. Go to `/dashboard/budget`, upload a small PDF
4. Wait for the chunk count to appear (should take 5-30 seconds depending on file size)
5. Click "Generate insider budget analysis" in the quick actions sidebar — the agent should retrieve chunks and produce output

## 6. Daily input automation (optional)

Add to `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/daily-ingest", "schedule": "0 6 * * *" }
  ]
}
```

Create `app/api/cron/daily-ingest/route.ts` that:

1. Verifies the `Authorization: Bearer $CRON_SECRET` header (Vercel provides this)
2. Pulls from your external source (RSS feed, S3 bucket, SharePoint, agency API)
3. Runs the same chunk/embed pipeline as `/api/upload`

Vercel Cron runs in UTC. `0 6 * * *` = 06:00 UTC = 02:00 EDT / 01:00 EST.

## 7. Custom domain

In Vercel → Settings → Domains, add your domain (e.g. `fedanalyst.yourdomain.gov`). Configure DNS as Vercel instructs. Update `NEXT_PUBLIC_SITE_URL` env var to match.

## 8. Observability

Minimal:
- Vercel → Observability → Logs (free tier: 1 hour retention)
- Supabase → Logs Explorer for database and auth

Production:
- Add `@vercel/analytics` or Plausible
- Add Sentry for error tracking
- Log all agent tool calls to a dedicated `agent_audit` table for compliance trail

## 9. Scaling notes

- **Edge vs Node runtime:** the chat route uses Node runtime because `pdf-parse` and the Anthropic SDK have Node-specific dependencies. Keep it there.
- **Chat duration:** `maxDuration = 60` in `vercel.json` for `/api/chat`. Vercel Pro plan allows 300s. Long multi-step agent runs will need Pro.
- **Chunk batching:** `/api/upload` processes 16 embeddings at a time. Adjust `BATCH` in `app/api/upload/route.ts` if Voyage/OpenAI rate limits bite.
- **Vector index:** ivfflat works up to ~100k chunks. Beyond that, HNSW (see Supabase section above).
- **Python functions:** one concurrent invocation per region on Hobby. Pro plan has higher limits.

## Troubleshooting

**"No embedding provider configured"** — set `VOYAGE_API_KEY` or `OPENAI_API_KEY`.

**"unauthorized" on upload** — Supabase session cookie is not being read. Check that you are signed in and that `middleware.ts` is not blocking the request.

**Chunks returning zero results** — verify the ivfflat index was built; run `analyze public.chunks;` in SQL editor.

**Python function cold starts slow** — first call takes ~3s to warm. Use a warmup cron if this matters.

**MCP calls timing out** — stdio transport requires the server process to be alive. For remote MCP servers use the SSE transport instead.
