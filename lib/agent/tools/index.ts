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
    description: 'List all documents in the workspace with their names, categories, sizes, and whether they are indexed and searchable. Call this first to understand what is available before searching.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['budget', 'audit', 'accounting', 'contracts'], description: 'Filter by category (optional)' },
      },
    },
  },
  {
    name: 'retrieve_chunks',
    description: 'Semantic search across all uploaded documents. Returns the most relevant passages. Call multiple times with different queries to get comprehensive coverage. Never ask user for file names — just search.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language search query, e.g. "FY27 O&M appropriation total by service"' },
        limit: { type: 'number', description: 'Passages to return (default 8, max 15)' },
        category: { type: 'string', enum: ['budget', 'audit', 'accounting', 'contracts'] },
      },
      required: ['query'],
    },
  },
  {
    name: 'generate_chart',
    description: 'Create an interactive chart. Use generously — for comparisons, rankings, breakdowns, trends. The user sees this rendered chart in the chat.',
    input_schema: {
      type: 'object',
      properties: {
        chart_type: { type: 'string', enum: ['bar', 'horizontal_bar', 'line', 'pie', 'stacked_bar', 'area'] },
        title: { type: 'string', description: 'Descriptive title that stands alone without context' },
        subtitle: { type: 'string', description: 'Data source or note (e.g. "Source: PB2027 P-1 exhibits")' },
        data: { type: 'array', items: { type: 'object' }, description: 'Array of data objects' },
        x_key: { type: 'string', description: 'Key for x-axis / category labels' },
        y_keys: { type: 'array', items: { type: 'string' }, description: 'Keys for y-axis values' },
        format: { type: 'string', enum: ['currency_b', 'currency_m', 'currency_k', 'percentage', 'count'], description: 'Number format for axis labels' },
      },
      required: ['chart_type', 'title', 'data', 'x_key'],
    },
  },
  {
    name: 'generate_report',
    description: 'Save a completed analysis to the report library. Call after producing the full analysis.',
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
    case 'list_documents':   return listDocuments(input, ctx)
    case 'retrieve_chunks':  return retrieveChunks(input, ctx)
    case 'generate_chart':   return { ok: true, chart: input }
    case 'generate_report':  return saveReport(input, ctx)
    default: return { error: `Unknown tool: ${name}` }
  }
}

// ── list_documents ────────────────────────────────────────────────

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
      group by d.id
      order by d.category, d.created_at desc
    `

    if (!rows.length) {
      return {
        document_count: 0,
        message: 'No documents uploaded yet. The user needs to upload files through the Document library.',
        documents: [],
      }
    }

    const docs = rows.map((r: any) => ({
      filename: r.filename,
      category: r.category,
      size_kb: Math.round(r.size_bytes / 1024),
      uploaded: r.created_at?.toString().slice(0, 10),
      indexed: (r.chunk_count ?? 0) > 0,
      chunk_count: r.chunk_count ?? 0,
      searchable: (r.chunk_count ?? 0) > 0,
    }))

    const indexed = docs.filter((d: any) => d.searchable).length
    const byCategory = docs.reduce((acc: Record<string, number>, d: any) => {
      acc[d.category] = (acc[d.category] || 0) + 1
      return acc
    }, {})

    return {
      document_count: docs.length,
      indexed_count: indexed,
      unindexed_count: docs.length - indexed,
      by_category: byCategory,
      documents: docs,
      note: indexed < docs.length
        ? `${docs.length - indexed} document(s) are not indexed and cannot be searched. Go to the Document library and click Re-embed.`
        : `All ${docs.length} document(s) are indexed and searchable.`,
    }
  } catch (e: any) {
    return { error: String(e), documents: [] }
  }
}

// ── retrieve_chunks ───────────────────────────────────────────────

async function retrieveChunks(input: { query: string; limit?: number; category?: string }, ctx: ToolExecutionContext) {
  try {
    const embedding = await embedQuery(input.query)
    const lit = `[${embedding.join(',')}]`
    const limit = Math.min(input.limit ?? 8, 15)
    const wsId = ctx.userId || DEFAULT_WORKSPACE_ID

    const rows = await sql`
      select d.filename, d.category, c.content, c.chunk_index,
             round((1 - (c.embedding <=> ${lit}::vector))::numeric, 3) as score
      from public.chunks c
      join public.documents d on d.id = c.document_id
      where d.workspace_id = ${wsId}::uuid
        and c.embedding is not null
        and (${input.category ?? null}::text is null or d.category = ${input.category ?? null})
        and 1 - (c.embedding <=> ${lit}::vector) > 0.15
      order by c.embedding <=> ${lit}::vector
      limit ${limit}
    `

    if (!rows.length) {
      // Diagnose why
      const docCount = await sql`
        select count(d.id)::int as docs,
               coalesce((select count(*)::int from public.chunks c2 join public.documents d2
                         on d2.id = c2.document_id where d2.workspace_id = ${wsId}::uuid), 0) as chunks
        from public.documents d where d.workspace_id = ${wsId}::uuid
      `
      const { docs, chunks } = docCount[0] ?? {}
      if (!docs || docs === 0) return { passages: [], note: 'No documents uploaded. Upload files through the Document library first.' }
      if (!chunks || chunks === 0) return { passages: [], note: `${docs} document(s) found but not indexed. Go to Document library → Re-embed all.` }
      return { passages: [], note: `No passages matched "${input.query}". Try a broader or different query.` }
    }

    return {
      passages: rows.map((r: any) => ({
        source: r.filename,
        category: r.category,
        relevance_score: r.score,
        text: String(r.content).slice(0, 1500),
      }))
    }
  } catch (e: any) {
    const msg = String(e)
    if (/GOOGLE_API_KEY/i.test(msg)) return { error: 'GOOGLE_API_KEY missing — set it in Vercel environment variables.', passages: [] }
    return { error: msg, passages: [] }
  }
}

// ── save_report ────────────────────────────────────────────────────

async function saveReport(input: { title: string; category: string; content_markdown: string }, ctx: ToolExecutionContext) {
  try {
    const wsId = ctx.userId || DEFAULT_WORKSPACE_ID
    const rows = await sql`
      insert into public.reports (workspace_id, skill_id, category, title, content)
      values (${wsId}::uuid, 'agent', ${input.category}, ${input.title}, ${input.content_markdown})
      returning id
    `
    return { ok: true, report_id: rows[0].id, message: 'Report saved successfully.' }
  } catch (e: any) {
    return { ok: false, error: String(e) }
  }
}
