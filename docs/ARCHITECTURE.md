# Architecture

## Request lifecycle — chat message

```
Client (ChatInterface)
  → POST /api/chat  (message, sessionId?, category?)
  → Supabase auth.getUser()  — verify JWT
  → Insert user message into chat_messages
  → Load last 40 messages for context
  → ReadableStream starts
  → runAgent(message, ctx, previousMessages, onEvent)
      loop up to 8 times:
        Anthropic messages.create(model, tools, messages, system)
        if stop_reason !== 'tool_use': break
        for each tool_use block:
          executeTool(name, input, ctx)
            retrieve_chunks → embedText() → match_chunks RPC (pgvector)
            python_analysis → fetch /api/analyze (Python runtime)
            generate_report → insert into reports table
            mcp_call → stdio transport → MCP server
          append tool_result to messages
      return { text, toolCalls }
  → Insert assistant message
  → Stream done event
Client re-renders with streamed text + tool call UI
```

## Data model

### documents
Upload metadata. One row per file. `storage_path` points to Supabase Storage.

### chunks
Text chunks + pgvector embeddings. `embedding vector(1024)`. Chunking: 1200 chars with 150 char overlap, paragraph-respecting split in `lib/embeddings.ts`.

### chat_sessions / chat_messages
Multi-turn conversations with tool call history in `tool_calls` JSONB.

### reports
Generated reports saved via the `generate_report` tool. Includes source document IDs so you can trace citations.

## Vector search

`match_chunks(query_embedding, threshold, count, filter_document_ids)` is a Postgres function using `<=>` (cosine distance). IVFFLAT index with 100 lists — acceptable up to ~100k chunks; switch to HNSW for larger corpora.

## Why Supabase

Four services in one:
1. Postgres (structured data)
2. pgvector (embeddings)
3. Auth (JWT, magic link, OAuth)
4. Storage (files with RLS)

Alternative stacks you might want:
- **Self-hosted:** Postgres + pgvector + own JWT + S3 — more control, more ops
- **Best-of-breed:** Neon/RDS + Pinecone + Clerk/Auth0 + S3 — more surface area
- **Vercel-native:** Vercel Postgres + Vercel Blob + NextAuth — fewer services but no vector DB yet

For a federal analyst MVP, Supabase is the lowest-friction option that still gives you pgvector.

## AI provider swap

`lib/agent/agent.ts` uses the Anthropic SDK directly. To support multiple providers:

1. Extract a minimal interface: `generateWithTools(model, system, tools, messages) → { content[], stop_reason }`
2. Implement adapters for Anthropic, OpenAI, Google Gemini, Vertex AI
3. Switch via `process.env.AI_PROVIDER`

The `TOOL_DEFINITIONS` in `lib/agent/tools/index.ts` are Anthropic-schema; OpenAI function calling requires light translation (same JSON schema, wrapper keys differ).

## Streaming

Server-Sent Events, not WebSockets. Events:

```json
{"type": "step", "step": 0, "stop_reason": null}
{"type": "text", "text": "The FY27 request …"}
{"type": "tool_call", "name": "retrieve_chunks", "input": {"query": "…"}}
{"type": "tool_result", "name": "retrieve_chunks", "output": {…}}
{"type": "done", "sessionId": "…"}
```

The client parses `data: ` lines and reduces events into the message state.

## Python runtime

`/api/analyze.py` is a Vercel Python serverless function (Python 3.12 with `@vercel/python@4.3.0`). Requirements in `api/requirements.txt`. Max duration 60s per `vercel.json`.

The function:
- Captures stdout
- Exposes `pd`, `np`, `plt`, `inputs` in a safe-ish globals dict
- Serializes DataFrames and arrays for JSON return
- Base64-encodes any matplotlib figure generated
- 60s signal alarm for timeout

Security: this is not a sandbox. The user's code runs with the function's permissions. Do not expose this to untrusted users without adding a real sandbox (Pyodide, Firecracker, or a hosted code-exec service).

## MCP integration

The client in `lib/agent/mcp/client.ts` uses the official TypeScript SDK with stdio transport. It caches connections per server spec.

To add SAM.gov lookups:

1. Write a Python MCP server that exposes `search_contract`, `get_opportunity`, etc.
2. Deploy it somewhere reachable (Railway, Render, or a local stdio process wrapped in SSH)
3. Add its invocation command to `MCP_SERVERS` env var
4. The agent calls it via the `mcp_call` tool

For production-grade remote MCP, use `SseClientTransport` instead of stdio.

## Extension points

**Add a skill:** edit `lib/agent/skills/index.ts`, add to the `SKILLS` array. Add a quick action in the relevant `app/dashboard/<category>/page.tsx`.

**Add a tool:** edit `lib/agent/tools/index.ts`, add to `TOOL_DEFINITIONS` and a case in `executeTool`.

**Add a category:** edit the `Category` type in `lib/types.ts`, add a route under `app/dashboard/<name>/page.tsx` using `CategoryPage`, add a nav entry in `components/features/dashboard-nav.tsx`, extend the SQL check constraints in the migration.

**Add an MCP server:** set `MCP_SERVERS` env var. Tools are discovered dynamically via `listMcpTools`.

**Add daily ingestion:** Vercel Cron in `vercel.json`:
```json
{ "crons": [{ "path": "/api/cron/daily-ingest", "schedule": "0 6 * * *" }] }
```
Create the endpoint to pull from external sources and run the same chunk/embed pipeline as `/api/upload`.
