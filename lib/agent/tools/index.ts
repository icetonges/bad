import { sql, DEFAULT_WORKSPACE_ID } from '@/lib/db/neon'
import { embedQuery } from '@/lib/embeddings'

export interface ToolDefinition {
  name: string
  description: string
  input_schema: { type: 'object'; properties: Record<string, unknown>; required?: string[] }
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'retrieve_chunks',
    description: 'Search the user\'s uploaded documents using natural language. Returns the most relevant passages. Do NOT ask the user for file names or IDs — just search.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to search for, e.g. "FY27 O&M appropriation total"' },
        category: { type: 'string', enum: ['budget', 'audit', 'accounting', 'contracts'] },
      },
      required: ['query'],
    },
  },
  {
    name: 'web_search',
    description: 'Search the public web for federal reference material: GAO reports, CRS, Federal Register, comptroller.defense.gov.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'generate_chart',
    description: 'Create an interactive chart the user can see. Use for budget breakdowns, trend lines, comparison bars.',
    input_schema: {
      type: 'object',
      properties: {
        chart_type: { type: 'string', enum: ['bar', 'horizontal_bar', 'line', 'pie', 'stacked_bar'] },
        title: { type: 'string' },
        data: { type: 'array', items: { type: 'object' } },
        x_key: { type: 'string' },
        y_keys: { type: 'array', items: { type: 'string' } },
      },
      required: ['chart_type', 'title', 'data', 'x_key'],
    },
  },
  {
    name: 'generate_report',
    description: 'Save a completed analysis as a report in the user\'s library.',
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
    case 'retrieve_chunks': return retrieveChunks(input, ctx)
    case 'web_search': return { note: 'Web search stub. Results not available — use document content.', query: input.query }
    case 'generate_chart': return { ok: true, chart: input }
    case 'generate_report': return saveReport(input, ctx)
    default: return { error: `Unknown tool: ${name}` }
  }
}

async function retrieveChunks(input: { query: string; category?: string }, ctx: ToolExecutionContext) {
  try {
    const embedding = await embedQuery(input.query)
    const lit = `[${embedding.join(',')}]`
    const wsId = ctx.userId || DEFAULT_WORKSPACE_ID
    const rows = await sql`
      select d.filename, c.content,
             round((1 - (c.embedding <=> ${lit}::vector))::numeric, 3) as score
      from public.chunks c
      join public.documents d on d.id = c.document_id
      where d.workspace_id = ${wsId}::uuid
        and c.embedding is not null
        and (${input.category ?? null}::text is null or d.category = ${input.category ?? null})
        and 1 - (c.embedding <=> ${lit}::vector) > 0.15
      order by c.embedding <=> ${lit}::vector
      limit 4
    `
    if (!rows.length) {
      const check = await sql`
        select count(d.id)::int as docs,
               (select count(*)::int from public.chunks c2
                join public.documents d2 on d2.id = c2.document_id
                where d2.workspace_id = ${wsId}::uuid) as chunks
        from public.documents d where d.workspace_id = ${wsId}::uuid
      `
      const { docs, chunks } = check[0] ?? {}
      if (!docs) return { passages: [], note: 'No documents uploaded. Upload files in the Document library first.' }
      if (!chunks) return { passages: [], note: `${docs} document(s) found but not indexed. Go to Document library and click Re-embed.` }
      return { passages: [], note: 'No matching passages found. Try a different query.' }
    }
    // Trim each passage to 1200 chars to control context size
    return {
      passages: rows.map((r: any) => ({
        source: r.filename,
        score: r.score,
        text: String(r.content).slice(0, 1200),
      }))
    }
  } catch (e: any) {
    return { error: String(e), passages: [] }
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
  } catch (e: any) {
    return { error: String(e) }
  }
}
