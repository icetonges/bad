# fedAnalyst

AI-powered analyst for U.S. federal government budget, audit, accounting, and contract work. Built on Next.js + Anthropic Claude + Supabase + Vercel.

## What this is

A production-ready scaffold for an analyst-facing web application that:

- Lets users upload federal documents (PB justifications, audit reports, financial statements, contract files) organized by category
- Chunks and embeds them into a pgvector knowledge base
- Exposes an AI agent (Claude, with swappable model) that can retrieve from the knowledge base, run Python analysis, generate charts, search the web, and call MCP tool servers
- Generates insider-quality analysis, dashboards, and standard reports through category-specific "skills"
- Handles auth via Supabase, storage via Supabase Storage, and contact form email via Resend or Gmail SMTP

This is a scaffold, not a finished product. The core flows work end-to-end once you configure the environment. The skills, tool definitions, and UI are intentionally opinionated starting points that you will extend.

## Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript | Server components + API routes in one deploy |
| UI | Tailwind CSS + Radix primitives (shadcn-style) | Accessible, unstyled primitives you fully control |
| AI | Anthropic Claude + tool use loop | Abstraction in `lib/agent/agent.ts` — swap provider there |
| Vector DB | Supabase Postgres + pgvector | One service covers DB, vectors, auth, storage |
| Embeddings | Voyage AI (primary) / OpenAI (fallback) | `lib/embeddings.ts` handles both |
| Python | Vercel Python serverless functions | pandas/numpy/matplotlib available in `api/*.py` |
| MCP | `@modelcontextprotocol/sdk` | Stdio client stub in `lib/agent/mcp/client.ts` |
| Email | Resend (primary) / Nodemailer + Gmail (fallback) | `app/api/contact/route.ts` handles both |
| Deploy | Vercel (app) + Supabase (backend services) | |

## Quick start

### 1. Clone and install

```bash
git clone <your-repo-url> fedanalyst
cd fedanalyst
npm install
```

### 2. Create a Supabase project

- Go to https://supabase.com and create a new project
- Copy the URL, anon key, and service role key into `.env.local`
- Apply the migration: run the SQL in `supabase/migrations/20260422000000_init.sql` in the SQL editor (or use the Supabase CLI: `supabase db push`)

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in at minimum: `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and one of `VOYAGE_API_KEY` or `OPENAI_API_KEY`.

For the contact form, either `RESEND_API_KEY` + `CONTACT_TO_EMAIL` or `GMAIL_USER` + `GMAIL_APP_PASSWORD` (Gmail app password, not OAuth — create at https://myaccount.google.com/apppasswords).

### 4. Run

```bash
npm run dev
```

Visit http://localhost:3000. Sign up at `/login`, then go to `/dashboard`.

### 5. Deploy to Vercel

```bash
npx vercel link
# Configure env vars in Vercel dashboard (match .env.local)
git push  # triggers auto-deploy
```

The `vercel.json` handles Python function routing and extended timeouts for the chat and reports endpoints.

## Architecture

```
app/
  page.tsx                       Landing
  layout.tsx
  login/page.tsx                 Auth
  dashboard/
    layout.tsx                   Dashboard shell with sidebar
    page.tsx                     Overview
    budget|audit|accounting|contracts/
      page.tsx                   Category pages — upload + quick actions
    chat/page.tsx                Agent chat with streaming
    reports/page.tsx             Report library
  api/
    chat/route.ts                SSE chat endpoint, wraps runAgent()
    upload/route.ts              File upload, chunking, embedding
    contact/route.ts             Contact form (Resend/Gmail)
    reports/route.ts             Report CRUD

lib/
  agent/
    agent.ts                     Core agent loop with tool use
    tools/index.ts               Tool definitions + executors
    skills/index.ts              Skill registry (system prompts per domain)
    mcp/client.ts                MCP stdio client
  db/supabase.ts                 Browser/server/admin Supabase clients
  embeddings.ts                  Voyage/OpenAI embedding + chunking
  types.ts                       Shared types
  utils.ts                       cn(), formatBytes(), formatDate()

api/
  analyze.py                     Python runtime for pandas/matplotlib work
  requirements.txt

supabase/
  migrations/                    Schema: documents, chunks, sessions,
                                 messages, reports, RLS, storage

components/
  ui/                            Button, Card, Input (shadcn-style)
  features/                      ChatInterface, FileUpload, ContactForm,
                                 DashboardNav, CategoryPage
```

## Agent architecture

The agent is a tool-use loop (`lib/agent/agent.ts`) that:

1. Loads the base system prompt + category-specific skill prompts
2. Sends the user's message plus prior conversation to Claude
3. If Claude requests tools, executes them in parallel and appends results
4. Loops until `stop_reason !== 'tool_use'` or max 8 steps
5. Streams text and tool events back to the client via SSE

### Tools available to the agent

| Tool | Purpose |
|---|---|
| `retrieve_chunks` | Semantic search over the user's uploaded documents via pgvector |
| `web_search` | Public web reference lookups (stub — wire to Anthropic/Brave/Tavily) |
| `python_analysis` | Execute Python in the Vercel serverless function |
| `generate_chart` | Emit Recharts-ready chart specs |
| `generate_report` | Save a finished report to the user's library |
| `mcp_call` | Call a tool on a connected MCP server |

### Skills

Skills are domain-specific system prompts + tool sets. Defined in `lib/agent/skills/`. Current skills: `budget_analysis_insider`, `audit_report_analysis`, `accounting_financial_data`, `contract_analysis`, `dashboard_generation`, `standard_report`.

Adding a skill is editing one file. See `lib/agent/skills/index.ts`.

### MCP

`lib/agent/mcp/client.ts` is a stdio transport wrapper. Set `MCP_SERVERS` env var to a comma-separated list of server commands (`python /path/to/server.py`, etc.). The `mcp_call` tool routes through it.

Production-grade example MCP servers for federal work would include: SAM.gov lookups, USASpending.gov queries, FPDS-NG searches, DATA Act retrievals. None of those are built — the scaffold is in place.

## Security and compliance notes

This is not a FedRAMP-authorized environment. Do not upload classified, CUI, or other controlled material without a proper authorization boundary. Before anything close to production use:

- Add a login banner with the appropriate AUP
- Enable rate limiting (middleware or Vercel Edge Config)
- Configure Supabase auth MFA
- Review the RLS policies in the migration — they rely on `auth.uid()`
- Consider an audit log of all agent actions
- Add DLP scanning of uploaded files
- Review Anthropic and Supabase data retention and decide whether you need a zero-retention or BAA arrangement

## What's stubbed vs. what works

Works end-to-end when configured:
- Auth, file upload, chunking, embedding, vector search
- Chat with streaming tool use
- All six skills with their system prompts
- Contact form (Resend or Gmail)
- Python analysis with pandas/matplotlib
- Report save-and-retrieve

Stubbed — implementation placeholder, structure in place:
- `web_search` tool — returns a note. Wire to Anthropic web_search tool, Tavily, Brave, or Google Programmable Search
- MCP server implementations — client is real, server configs are not bundled
- Realtime dashboard rendering — tool emits chart specs; a `<DashboardRenderer>` Recharts component is the natural extension
- Daily input automation (cron-triggered ingestion) — Vercel Cron is the hook, not wired

## License

MIT — see LICENSE.

## Contributing

This is a scaffold. Fork, modify, deploy. If you build something useful on top of it, a note back is appreciated but not required.
