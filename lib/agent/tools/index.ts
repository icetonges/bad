import type Anthropic from '@anthropic-ai/sdk'
import { createAdminSupabase } from '@/lib/db/supabase'
import { embedText } from '@/lib/embeddings'

export type ToolDefinition = Anthropic.Messages.Tool

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'retrieve_chunks',
    description:
      'Semantic search across the user\'s uploaded documents. Returns the most relevant passages with source document IDs. Use this whenever the user asks about the content of documents they have uploaded, or when producing an analysis that should be grounded in source material.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language query describing what you want to find.' },
        document_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional — restrict search to specific document IDs. Omit to search all of the user\'s documents in the active category.',
        },
        limit: { type: 'number', description: 'Number of passages to return. Default 8, max 20.', default: 8 },
        category: { type: 'string', enum: ['budget', 'audit', 'accounting', 'contracts'] },
      },
      required: ['query'],
    },
  },
  {
    name: 'web_search',
    description:
      'Search the public web for current information. Use for published GAO/IG reports, CRS reports, Federal Register notices, SAM.gov postings, congressional markups, current appropriations status, or other public federal reference material.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        recency: { type: 'string', enum: ['day', 'week', 'month', 'year', 'all'] },
      },
      required: ['query'],
    },
  },
  {
    name: 'python_analysis',
    description:
      'Execute a Python analysis job in the Vercel Python runtime with access to pandas, numpy, matplotlib. Use for non-trivial data transformations, obligation rate calculations, trend regressions, and chart generation from tabular data. Code must be self-contained.',
    input_schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Python source to execute. Return a JSON-serializable result on stdout.' },
        inputs: { type: 'object', description: 'Named inputs available inside the script as `inputs["key"]`.' },
      },
      required: ['code'],
    },
  },
  {
    name: 'generate_chart',
    description:
      'Produce a Recharts-ready chart spec that the frontend will render. Use this when visualization would strengthen the analysis.',
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
    description: 'Save a finalized report to the user\'s report library. Call this only after the analysis is complete.',
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
      'Invoke a tool on a connected MCP (Model Context Protocol) server. Use when specialized capability is exposed via an MCP server the user has connected — e.g. SAM.gov lookups, USASpending queries, agency-specific systems.',
    input_schema: {
      type: 'object',
      properties: {
        server: { type: 'string', description: 'MCP server identifier.' },
        tool: { type: 'string', description: 'Tool name on that server.' },
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
    case 'retrieve_chunks':
      return retrieveChunks(input, ctx)
    case 'web_search':
      return webSearch(input)
    case 'python_analysis':
      return pythonAnalysis(input)
    case 'generate_chart':
      return generateChart(input)
    case 'generate_report':
      return generateReport(input, ctx)
    case 'mcp_call':
      return mcpCall(input)
    default:
      return { error: `Unknown tool: ${name}` }
  }
}

async function retrieveChunks(
  input: { query: string; document_ids?: string[]; limit?: number; category?: string },
  ctx: ToolExecutionContext
) {
  const supabase = createAdminSupabase()
  const embedding = await embedText(input.query)
  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: embedding,
    match_threshold: 0.4,
    match_count: Math.min(input.limit ?? 8, 20),
    filter_document_ids: input.document_ids ?? null,
  })
  if (error) return { error: error.message }
  return { chunks: data }
}

async function webSearch(input: { query: string; recency?: string }) {
  return {
    note: 'Web search is a stub in this scaffold. Wire to Anthropic web_search tool, Tavily, Brave, or Google Programmable Search.',
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

async function generateChart(input: unknown) {
  return { ok: true, chart: input }
}

async function generateReport(
  input: { title: string; category: string; content_markdown: string; source_document_ids?: string[] },
  ctx: ToolExecutionContext
) {
  const supabase = createAdminSupabase()
  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: ctx.userId,
      skill_id: 'standard_report',
      category: input.category,
      title: input.title,
      content: input.content_markdown,
      source_documents: input.source_document_ids ?? [],
    })
    .select()
    .single()
  if (error) return { error: error.message }
  return { ok: true, report_id: data.id }
}

async function mcpCall(input: { server: string; tool: string; arguments: Record<string, unknown> }) {
  const { callMcpTool } = await import('@/lib/agent/mcp/client')
  return callMcpTool(input.server, input.tool, input.arguments)
}
