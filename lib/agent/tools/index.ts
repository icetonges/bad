import { sql, DEFAULT_WORKSPACE_ID } from '@/lib/db/neon'
import { embedQuery } from '@/lib/embeddings'

export interface ToolDefinition {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'retrieve_chunks',
    description:
      "Semantic search across uploaded documents. Returns the most relevant passages with source document IDs. Use whenever the user asks about their uploaded documents, or when analysis should be grounded in source material.",
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language query.' },
        document_ids: { type: 'array', items: { type: 'string' } },
        limit: { type: 'number', description: 'Max passages. Default 8, max 20.' },
        category: { type: 'string', enum: ['budget', 'audit', 'accounting', 'contracts'] },
      },
      required: ['query'],
    },
  },
  {
    name: 'web_search',
    description:
      "Search the public web. Use for GAO/IG reports, CRS reports, Federal Register, SAM.gov, congressional markups, or other public federal reference material.",
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
      },
      required: ['query'],
    },
  },
  {
    name: 'python_analysis',
    description:
      "Execute Python with pandas, numpy, matplotlib available. Use for data transformations, obligation rate calculations, trend regressions, chart generation from tabular data.",
    input_schema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        inputs: { type: 'object' },
      },
      required: ['code'],
    },
  },
  {
    name: 'generate_chart',
    description: 'Produce a Recharts-ready chart spec that the frontend renders. Use when visualization strengthens analysis.',
    input_schema: {
      type: 'object',
      properties: {
        chart_type: { type: 'string', enum: ['bar', 'horizontal_bar', 'stacked_bar', 'line', 'area', 'pie', 'scatter'] },
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
    description: "Save a finalized report to the user's library. Call only after analysis is complete.",
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        category: { type: 'string', enum: ['budget', 'audit', 'accounting', 'contracts'] },
        content_markdown: { type: 'string' },
        source_document_ids: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'category', 'content_markdown'],
    },
  },
  {
    name: 'mcp_call',
    description:
      'Invoke a tool on a connected MCP server. Use when specialized capability is exposed via MCP — e.g. SAM.gov lookups, USASpending queries.',
    input_schema: {
      type: 'object',
      properties: {
        server: { type: 'string' },
        tool: { type: 'string' },
        arguments: { type: 'object' },
      },
      required: ['server', 'tool', 'arguments'],
    },
  },
]

export interface ToolExecutionContext {
  userId: string
  sessionId: string
  category?: string
}

export async function executeTool(
  name: string,
  input: any,
  ctx: ToolExecutionContext
): Promise<unknown> {
  switch (name) {
    case 'retrieve_chunks': return retrieveChunks(input, ctx)
    case 'web_search': return webSearch(input)
    case 'python_analysis': return pythonAnalysis(input)
    case 'generate_chart': return { ok: true, chart: input }
    case 'generate_report': return generateReport(input, ctx)
    case 'mcp_call': return mcpCall(input)
    default: return { error: `Unknown tool: ${name}` }
  }
}

async function retrieveChunks(
  input: { query: string; document_ids?: string[]; limit?: number; category?: string },
  ctx: ToolExecutionContext
) {
  try {
    const embedding = await embedQuery(input.query)
    const embeddingLit = `[${embedding.join(',')}]`
    const limit = Math.min(input.limit ?? 8, 20)
    const workspaceId = ctx.userId || DEFAULT_WORKSPACE_ID
    const docIds = input.document_ids ?? null

    const rows = await sql`
      select
        c.id, c.document_id, d.filename, c.content,
        1 - (c.embedding <=> ${embeddingLit}::vector) as similarity
      from public.chunks c
      join public.documents d on d.id = c.document_id
      where d.workspace_id = ${workspaceId}::uuid
        and (${docIds}::uuid[] is null or c.document_id = any(${docIds}::uuid[]))
        and c.embedding is not null
        and (${input.category}::text is null or d.category = ${input.category})
        and 1 - (c.embedding <=> ${embeddingLit}::vector) > 0.35
      order by c.embedding <=> ${embeddingLit}::vector
      limit ${limit}
    `
    return { chunks: rows }
  } catch (e) {
    return { error: String(e), chunks: [] }
  }
}

async function webSearch(input: { query: string }) {
  return {
    note: 'Web search stub. Wire to Tavily, Brave, or Google Custom Search in lib/agent/tools/index.ts.',
    query: input.query,
    results: [],
  }
}

async function pythonAnalysis(input: { code: string; inputs?: Record<string, unknown> }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  try {
    const response = await fetch(`${base}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    return await response.json()
  } catch (e) {
    return { error: String(e) }
  }
}

async function generateReport(
  input: { title: string; category: string; content_markdown: string; source_document_ids?: string[] },
  ctx: ToolExecutionContext
) {
  try {
    const workspaceId = ctx.userId || DEFAULT_WORKSPACE_ID
    const srcIds = input.source_document_ids ?? []
    const rows = await sql`
      insert into public.reports
        (workspace_id, skill_id, category, title, content, source_documents)
      values
        (${workspaceId}::uuid, 'standard_report', ${input.category}, ${input.title}, ${input.content_markdown}, ${srcIds}::uuid[])
      returning id
    `
    return { ok: true, report_id: rows[0].id }
  } catch (e) {
    return { error: String(e) }
  }
}

async function mcpCall(input: { server: string; tool: string; arguments: Record<string, unknown> }) {
  const { callMcpTool } = await import('@/lib/agent/mcp/client')
  return callMcpTool(input.server, input.tool, input.arguments)
}
