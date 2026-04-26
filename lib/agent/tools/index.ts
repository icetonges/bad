import { sql, DEFAULT_WORKSPACE_ID } from '@/lib/db/neon'
import { embedQuery } from '@/lib/embeddings'

export interface ToolDefinition {
  name: string
  description: string
  input_schema: { type: 'object'; properties: Record<string, unknown>; required?: string[] }
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'list_documents',
    description: 'List all documents in the workspace — names, categories, sizes, and whether indexed. Call first to understand what is available.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['budget', 'audit', 'accounting', 'contracts'] },
      },
    },
  },
  {
    name: 'retrieve_chunks',
    description: 'Semantic search across ALL uploaded documents. Returns relevant passages. For comprehensive analysis, call 5-15 times with DIFFERENT specific queries covering different aspects. Never ask the user for file names.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Specific natural language query' },
        limit: { type: 'number', description: 'Passages to return (default 12, max 20)' },
        category: { type: 'string', enum: ['budget', 'audit', 'accounting', 'contracts'] },
      },
      required: ['query'],
    },
  },
  {
    name: 'generate_chart',
    description: 'Create an interactive chart visible to the user. Use generously for all numerical comparisons.',
    input_schema: {
      type: 'object',
      properties: {
        chart_type: { type: 'string', enum: ['bar', 'horizontal_bar', 'line', 'pie', 'stacked_bar', 'area'] },
        title: { type: 'string' },
        subtitle: { type: 'string' },
        data: { type: 'array', items: { type: 'object' } },
        x_key: { type: 'string' },
        y_keys: { type: 'array', items: { type: 'string' } },
        format: { type: 'string', enum: ['currency_b', 'currency_m', 'currency_k', 'percentage', 'count'] },
      },
      required: ['chart_type', 'title', 'data', 'x_key'],
    },
  },
  {
    name: 'generate_report',
    description: 'Save a completed analysis to the report library.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        category: { type: 'string', enum: ['budget', 'audit', 'accounting', 'contracts'] },
        content_markdown: { type: 'string' },
      },
      required: ['title', 'category', 'content_markdown'],
    },
  },
]

export interface ToolExecutionContext { userId: string; sessionId: string; category?: string }

export async function executeTool(name: string, input: any, ctx: ToolExecutionContext): Promise<unknown> {
  switch (name) {
    case 'list_documents':  return listDocuments(input, ctx)
    case 'retrieve_chunks': return retrieveChunks(input, ctx)
    case 'generate_chart':  return { ok: true, chart: input }
    case 'generate_report': return saveReport(input, ctx)
    default: return { error: `Unknown tool: ${name}` }
  }
}

async function listDocuments(input: { category?: string }, ctx: ToolExecutionContext) {
  try {
    const wsId = ctx.userId || DEFAULT_WORKSPACE_ID
    const rows = await sql`
      select d.id, d.filename, d.category, d.size_bytes, d.created_at,
             count(c.id)::int as chunk_count
      from public.documents d
      left join public.chunks c on c.document_id = d.id
      where d.workspace_id = ${wsId}::uuid
        and (${input.category ?? null}::text is null or d.category = ${input.category ?? null})
      group by d.id order by d.category, d.created_at desc
    `
    if (!rows.length) return { document_count: 0, message: 'No documents uploaded.', documents: [] }
    const docs = rows.map((r: any) => ({
      filename: r.filename, category: r.category,
      size_kb: Math.round(r.size_bytes / 1024),
      uploaded: r.created_at?.toString().slice(0, 10),
      chunk_count: r.chunk_count ?? 0,
      searchable: (r.chunk_count ?? 0) > 0,
    }))
    const indexed = docs.filter((d: any) => d.searchable)
    return {
      document_count: docs.length,
      indexed_count: indexed.length,
      total_chunks: indexed.reduce((s: number, d: any) => s + d.chunk_count, 0),
      documents: docs,
      note: indexed.length < docs.length ? `${docs.length - indexed.length} document(s) not indexed — go to library and Re-embed.` : `All ${docs.length} documents searchable.`,
    }
  } catch (e: any) { return { error: String(e), documents: [] } }
}

// Global deduplication across all retrieve_chunks calls in a session
const sessionPassages = new Map<string, Set<string>>()

async function retrieveChunks(input: { query: string; limit?: number; category?: string }, ctx: ToolExecutionContext) {
  try {
    const embedding = await embedQuery(input.query)
    const lit = `[${embedding.join(',')}]`
    const limit = Math.min(input.limit ?? 12, 20)
    const wsId = ctx.userId || DEFAULT_WORKSPACE_ID

    const rows = await sql`
      select d.filename, d.category, c.content, c.chunk_index,
             round((1 - (c.embedding <=> ${lit}::vector))::numeric, 3) as score
      from public.chunks c
      join public.documents d on d.id = c.document_id
      where d.workspace_id = ${wsId}::uuid
        and c.embedding is not null
        and (${input.category ?? null}::text is null or d.category = ${input.category ?? null})
        and 1 - (c.embedding <=> ${lit}::vector) > 0.05
      order by c.embedding <=> ${lit}::vector
      limit ${limit}
    `

    if (!rows.length) {
      const check = await sql`
        select count(d.id)::int as docs,
               coalesce((select count(*)::int from public.chunks c2 join public.documents d2 on d2.id = c2.document_id where d2.workspace_id = ${wsId}::uuid), 0) as chunks
        from public.documents d where d.workspace_id = ${wsId}::uuid
      `
      const { docs, chunks } = check[0] ?? {}
      if (!docs) return { passages: [], note: 'No documents uploaded yet.' }
      if (!chunks) return { passages: [], note: `${docs} document(s) found but not indexed. Go to Document library → Re-embed all.` }
      return { passages: [], note: `No passages matched "${input.query}". The document may have poor text extraction. Try broader keywords.` }
    }

    // Deduplicate — track content hashes across calls within session
    const sessKey = ctx.sessionId || 'default'
    if (!sessionPassages.has(sessKey)) sessionPassages.set(sessKey, new Set())
    const seen = sessionPassages.get(sessKey)!

    const unique = rows.filter((r: any) => {
      const key = `${r.filename}:${r.chunk_index}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return {
      passages: unique.map((r: any) => ({
        source: r.filename,
        category: r.category,
        relevance_score: r.score,
        text: String(r.content).slice(0, 2000),
      })),
      total_found: rows.length,
      unique_new: unique.length,
    }
  } catch (e: any) {
    const msg = String(e)
    if (/GOOGLE_API_KEY/i.test(msg)) return { error: 'GOOGLE_API_KEY missing.', passages: [] }
    return { error: msg, passages: [] }
  }
}

async function saveReport(input: { title: string; category: string; content_markdown: string }, ctx: ToolExecutionContext) {
  try {
    const wsId = ctx.userId || DEFAULT_WORKSPACE_ID
    const rows = await sql`
      insert into public.reports (workspace_id, skill_id, category, title, content)
      values (${wsId}::uuid, 'agent', ${input.category}, ${input.title}, ${input.content_markdown})
      returning id
    `
    return { ok: true, report_id: rows[0].id }
  } catch (e: any) { return { ok: false, error: String(e) } }
}
