# Architecture

## Request lifecycle — chat message

```
Client (ChatInterface)
  → POST /api/chat  (message, sessionId?, category?)
  → getWorkspaceId() from X-Workspace-Id header (default if absent)
  → sql: insert user message into chat_messages
  → sql: load last 40 messages
  → ReadableStream starts
  → runAgent(message, ctx, previousMessages, onEvent)
      for step in 0..8:
        generateWithTools(system, messages, tools)
          try Gemini 2.5 Flash Lite
          on error → try Llama 3.3 70B
          on error → try Llama 3.1 8B
          on error → try Gemini 2.0 Flash
          all failed → throw
        emit 'provider' event with the model that answered
        if stop_reason !== 'tool_use': break
        for each tool_call:
          executeTool(name, input, ctx)
            retrieve_chunks → embedQuery() → pgvector search via sql``
            python_analysis → fetch /api/analyze
            generate_report → sql: insert into reports
            mcp_call → stdio transport → MCP server
          emit 'tool_result' event
          append tool message for next iteration
      return { text, toolCalls }
  → sql: insert assistant message
  → stream 'done' event
Client re-renders with streamed text + tool UI
```

## Data model

All tables are workspace-scoped via `workspace_id uuid` defaulting to `00000000-0000-0000-0000-000000000001`. A default workspace row is inserted by the migration. To add multi-tenancy, write to `workspace_id` based on your auth context.

### documents
File metadata. `storage_url` points to Vercel Blob.

### chunks
Text + 768-dimension pgvector embeddings. Chunking: 1200 chars with 150 char overlap, paragraph-respecting (see `lib/embeddings.ts`).

### chat_sessions / chat_messages
Multi-turn conversations with tool call history in `tool_calls` JSONB.

### reports
Generated reports saved via `generate_report` tool. Tracks source document IDs.

### workspaces
Single default row for now. Add more when adding auth.

## Why Neon

Same project as your aimlgov.vercel.app — reuse the existing DB connection. Neon's serverless driver (`@neondatabase/serverless`) speaks HTTPS to Postgres, which works in Vercel Edge runtime (no TCP). Auto-suspends when idle, scales to zero. pgvector is supported natively.

## Why Gemini + Groq waterfall

Both are free at usable quotas. Gemini 2.5 Flash Lite is the fastest + cheapest. Groq Llama 3.3 70B is the most capable free model with real tool use. Failing over means the app stays up even if one provider rate-limits.

Both use OpenAI-compatible tool-use schemas, so the normalization in `lib/ai/provider.ts` is mechanical — message-shape translation, schema sanitization (Gemini has stricter schema rules — no `additionalProperties`, types uppercase).

## Why Vercel Blob

Native Vercel integration, no cross-cloud IAM setup. Free tier (500 MB) covers the MVP. Alternatives: S3 (more ops), Supabase Storage (adds another service), Cloudflare R2 (egress-free but needs worker).

## Vector search

`retrieve_chunks` does an inline cosine similarity search. The SQL:

```sql
select c.id, c.document_id, d.filename, c.content,
       1 - (c.embedding <=> $1::vector) as similarity
from chunks c
join documents d on d.id = c.document_id
where d.workspace_id = $2::uuid
  and c.embedding is not null
  and 1 - (c.embedding <=> $1::vector) > 0.35
order by c.embedding <=> $1::vector
limit $3
```

IVFFLAT index with 100 lists. Good up to ~100k chunks. Switch to HNSW beyond that.

## Tool use normalization

Anthropic, OpenAI, and Gemini each have slightly different tool schemas:

| | Anthropic | OpenAI/Groq | Gemini |
|---|---|---|---|
| Tool def | `tools: [{name, description, input_schema}]` | `tools: [{type: 'function', function: {name, description, parameters}}]` | `tools: [{functionDeclarations: [...]}]` |
| Tool result | `{type: 'tool_result', tool_use_id, content}` | `{role: 'tool', tool_call_id, content}` | `{functionResponse: {name, response}}` |
| Schema caveat | — | — | No `additionalProperties`, type strings uppercase |

`lib/ai/provider.ts` normalizes to a `UnifiedMessage` / `UnifiedTool` internal format and emits the right shape per provider. When you add a new provider (e.g. Anthropic Claude, OpenRouter), that's the only file to touch.

## Python runtime

`/api/analyze.py` is Vercel Python with `@vercel/python@4.3.0`. Requirements in `api/requirements.txt`.

Exposes `pd`, `np`, `inputs` in a semi-safe globals dict. Captures stdout, serializes DataFrames. 60s signal alarm for timeout.

Note: matplotlib is intentionally excluded — adding it pushes the Python function past Vercel's 250 MB limit. Charts render client-side via the `generate_chart` tool (Recharts).

Not a sandbox. Don't expose `/api/analyze` to untrusted users as-is.

## MCP integration

`lib/agent/mcp/client.ts` uses the official TypeScript SDK with stdio transport. Caches connections per server spec. See `docs/MCP_SETUP.md`.

## Extension points

**Add a skill:** `lib/agent/skills/index.ts` — add the constant, push into `SKILLS`. Add quick action in the category page.

**Add a tool:** `lib/agent/tools/index.ts` — add to `TOOL_DEFINITIONS`, add case in `executeTool`.

**Add a category:** edit `Category` type in `lib/types.ts`, add `app/dashboard/<name>/page.tsx` using `CategoryPage`, add nav entry, extend SQL check constraints.

**Add an AI provider:** edit `lib/ai/provider.ts` — add to `MODEL_WATERFALL` and implement the `call<Provider>` function. The unified message/tool shape is already defined.

**Add auth:** edit `getWorkspaceId` in `lib/db/neon.ts` to read from session instead of header. All routes already use it — no other changes needed.

**Add daily cron:** `vercel.json` + `app/api/cron/daily-ingest/route.ts`. Run the same chunk/embed pipeline as `/api/upload`.
