# fedAnalyst

AI-powered analyst for U.S. federal government budget, audit, accounting, and contract work. Built on Next.js + Gemini/Groq + Neon Postgres + Vercel.

## What this is

A production-ready scaffold for an analyst web app that:

- Lets users upload federal documents (PB justifications, audit reports, financial statements, contract files) organized by category
- Chunks and embeds them into a Neon pgvector knowledge base
- Exposes an AI agent that can retrieve from the knowledge base, run Python analysis, generate charts, search the web, and call MCP tool servers
- Runs on a **multi-model waterfall** — Gemini 2.5 Flash Lite → Groq Llama 3.3 70B → Groq Llama 3.1 8B → Gemini 2.0 Flash. All free tier.
- Generates insider-quality analysis, dashboards, and standard reports through category-specific "skills"
- Stores uploaded files in Vercel Blob, data in Neon Postgres

This is a scaffold, not a finished product. The core flows work end-to-end once you configure the environment.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router + TypeScript | Server components + API routes in one deploy |
| UI | Tailwind + Radix (shadcn-style) | Accessible, unstyled primitives |
| AI | Gemini + Groq waterfall in `lib/ai/provider.ts` | Free tier, automatic failover |
| Database | Neon Postgres + pgvector | Serverless, generous free tier, same project as aimlgov.vercel.app |
| Embeddings | Gemini `text-embedding-004` (768-dim) | Free tier |
| Storage | Vercel Blob | Native integration |
| Python | Vercel Python serverless | pandas/numpy/matplotlib for heavy analysis |
| MCP | `@modelcontextprotocol/sdk` | Tool server protocol support |
| Email | Resend | Contact form |
| Auth | None (public app, workspace-scoped) | Add later when ready — see `lib/db/neon.ts` |

## Quick start

```bash
# 1. Install
npm install

# 2. Copy env and fill in keys
cp .env.example .env.local
#   Reuse DATABASE_URL, PGHOST, PGUSER, PGPASSWORD, PGDATABASE from aimlgov.vercel.app
#   Add GOOGLE_API_KEY (https://aistudio.google.com/apikey)
#   Add GROQ_API_KEY (https://console.groq.com/keys)
#   Add BLOB_READ_WRITE_TOKEN from Vercel Storage → Blob

# 3. Apply database schema to Neon
npm run db:migrate

# 4. Run
npm run dev
```

Visit http://localhost:3000 and navigate to `/dashboard`.

## Provider waterfall behavior

`lib/ai/provider.ts` implements a waterfall: it tries each provider in order and falls through on error or missing env var. Order matches your aimlgov preferences:

1. **Gemini 2.5 Flash Lite** — fastest and cheapest
2. **Groq Llama 3.3 70B Versatile** — reliable fallback
3. **Groq Llama 3.1 8B Instant** — lowest latency fallback
4. **Gemini 2.0 Flash** — last resort

Each call emits a `provider` event so the UI shows which model answered. All four support native tool use with the same tool schemas.

To change priority, edit `MODEL_WATERFALL` in `lib/ai/provider.ts`.

## Environment variables

Required:

- `GOOGLE_API_KEY` — Gemini + embeddings
- `GROQ_API_KEY` — Llama fallbacks
- `DATABASE_URL` — Neon pooled connection
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob

Optional:

- `RESEND_API_KEY` + `CONTACT_TO_EMAIL` — contact form
- `MCP_SERVERS` — comma-separated MCP server commands
- `NEXT_PUBLIC_SITE_URL` — for the Python tool to reach `/api/analyze`

See `.env.example` for the full list.

## Architecture

```
app/
  page.tsx                       Landing
  contact/page.tsx               Contact form
  dashboard/
    layout.tsx                   Dashboard shell with sidebar
    page.tsx                     Overview
    budget|audit|accounting|contracts/page.tsx
                                 Category pages — upload + quick actions
    chat/page.tsx                Agent chat with streaming
    reports/page.tsx             Report library
  api/
    chat/route.ts                SSE chat endpoint (wraps runAgent)
    upload/route.ts              Vercel Blob upload + chunk + embed
    contact/route.ts             Resend (Gmail fallback)
    reports/route.ts             Report CRUD

lib/
  ai/provider.ts                 Gemini + Groq waterfall with tool use
  agent/
    agent.ts                     Agent loop
    tools/index.ts               Tool definitions + Neon-backed executors
    skills/index.ts              Domain skill prompts
    mcp/client.ts                MCP stdio client
  db/neon.ts                     Neon serverless driver + workspace helpers
  embeddings.ts                  Gemini text-embedding-004 + chunking
  types.ts                       Shared types
  utils.ts

api/
  analyze.py                     Vercel Python — pandas/numpy/matplotlib

db/
  migrations/001_init.sql        Neon schema: documents, chunks, sessions,
                                 messages, reports, match_chunks function

scripts/
  migrate.mjs                    Applies SQL migrations to Neon
  setup.sh                       Local bootstrap

components/
  ui/                            Button, Card, Input
  features/                      ChatInterface, FileUpload, ContactForm,
                                 DashboardNav, CategoryPage, DashboardRenderer
```

## Agent architecture

The agent is a tool-use loop (`lib/agent/agent.ts`) that:

1. Builds the system prompt from base + category-specific skills
2. Calls `generateWithTools` — which tries the waterfall
3. If the response wants tools, executes them (in parallel) and appends results
4. Loops up to 8 steps
5. Streams events back via SSE

### Tools available

| Tool | Purpose |
|---|---|
| `retrieve_chunks` | Semantic search over uploaded documents via pgvector |
| `web_search` | Public web lookups (stub — wire to Tavily, Brave, or Google CSE) |
| `python_analysis` | Execute Python in the Vercel Python function |
| `generate_chart` | Recharts-ready chart spec |
| `generate_report` | Save a finished report |
| `mcp_call` | Call a tool on a connected MCP server |

### Skills

Domain-specific system prompts in `lib/agent/skills/index.ts`:

- `budget_analysis_insider` — GS-15 quality budget analysis
- `audit_report_analysis` — GAO/IG findings, CAPs, opinion readiness
- `accounting_financial_data` — USSGL-aware, BA/obligations/outlays distinct
- `contract_analysis` — FAR/DFARS-aware cost proposal and performance review
- `dashboard_generation` — structured chart specs
- `standard_report` — federal report structure

Adding a skill is one file edit. See `docs/AGENT_SKILLS.md`.

## Workspace model

No auth. The app uses a single default workspace (`00000000-0000-0000-0000-000000000001`). Multi-tenancy is ready — the `getWorkspaceId` helper in `lib/db/neon.ts` looks for an `X-Workspace-Id` header. To add real auth later:

1. Pick a provider (Stack Auth since you already have Neon Auth vars, or NextAuth, or Clerk)
2. Set the workspace header from the authenticated session
3. Add a `workspace_members` table if you want multi-user-per-workspace

## What's stubbed

- `web_search` tool — returns a note. Easy to wire to Tavily or Brave Search
- MCP server implementations — client works; example servers documented in `docs/MCP_SETUP.md`
- Daily ingestion cron — documented, not wired

## License

MIT — see LICENSE.
