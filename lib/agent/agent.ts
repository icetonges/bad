import { generateWithTools, type UnifiedMessage, type UnifiedTool } from '@/lib/ai/provider'
import { TOOL_DEFINITIONS, executeTool } from './tools'
import { getSkillForCategory } from './skills'
import { sql, DEFAULT_WORKSPACE_ID } from '@/lib/db/neon'
import type { AgentContext } from '@/lib/types'

// ── Workspace context fetcher ──────────────────────────────────────
// Injected into every conversation so the agent always knows what's available.

async function getWorkspaceContext(userId: string, category?: string): Promise<string> {
  try {
    const wsId = userId || DEFAULT_WORKSPACE_ID
    const rows = await sql`
      select d.filename, d.category, d.size_bytes,
             count(c.id)::int as chunk_count
      from public.documents d
      left join public.chunks c on c.document_id = d.id
      where d.workspace_id = ${wsId}::uuid
      group by d.id
      order by d.category, d.created_at desc
    `

    if (!rows.length) {
      return '## WORKSPACE STATUS\nNo documents have been uploaded yet. Tell the user to upload files through the Document library before analysis can proceed.'
    }

    const indexed = rows.filter((r: any) => (r.chunk_count ?? 0) > 0)
    const unindexed = rows.filter((r: any) => (r.chunk_count ?? 0) === 0)
    const byCategory: Record<string, any[]> = {}
    for (const r of indexed) {
      const cat = (r as any).category
      if (!byCategory[cat]) byCategory[cat] = []
      byCategory[cat].push({ name: (r as any).filename, chunks: (r as any).chunk_count, size_kb: Math.round((r as any).size_bytes / 1024) })
    }

    let ctx = `## WORKSPACE — WHAT YOU HAVE ACCESS TO\n`
    ctx += `Total documents: ${rows.length} (${indexed.length} searchable, ${unindexed.length} not indexed)\n\n`

    for (const [cat, docs] of Object.entries(byCategory)) {
      ctx += `### ${cat.toUpperCase()} documents (${docs.length} files, fully searchable):\n`
      for (const d of docs) ctx += `- ${d.name} (${d.chunks} indexed passages, ${d.size_kb}KB)\n`
      ctx += '\n'
    }

    if (unindexed.length > 0) {
      ctx += `### NOT YET SEARCHABLE (need Re-embed):\n`
      for (const r of unindexed) ctx += `- ${(r as any).filename} (${(r as any).category})\n`
      ctx += '\n'
    }

    ctx += `Use retrieve_chunks to search these documents. You do NOT need to ask the user for file names.\n`
    ctx += `When the user asks "how many documents" or "what files", answer from this list directly.\n`

    return ctx
  } catch (e) {
    return '## WORKSPACE STATUS\nCould not load workspace context. Proceed using retrieve_chunks to search documents.'
  }
}

// ── Base system prompt ─────────────────────────────────────────────

const BASE_SYSTEM = `You are FedFMMatter — an expert AI analyst for U.S. federal government financial management.

## YOUR CAPABILITIES
- You know what documents the user has uploaded (see WORKSPACE section below)
- You can search those documents with retrieve_chunks
- You can create charts with generate_chart
- You can list all documents with list_documents
- You can save reports with generate_report

## CRITICAL OPERATING RULES

**Document access:** Use retrieve_chunks with natural language queries. Never ask for file names or IDs. The workspace section below tells you exactly what's available.

**On "how many documents" or "what files":** Answer directly from the WORKSPACE context — do not call list_documents unless the user wants details.

**On analysis requests:** 
1. Search with retrieve_chunks using 3-5 different queries to get broad coverage
2. Generate charts for every numerical comparison
3. Write a complete, structured analysis — do not cut off
4. Cite source filename for every fact

**On "save as report":** After analysis, call generate_report with the full text.

**Never:** Make up numbers. Ask for document IDs. Say you "cannot access" files without trying retrieve_chunks first.`

// ── Event types ────────────────────────────────────────────────────

export type AgentEvent =
  | { type: 'status'; message: string }
  | { type: 'provider'; provider: string; model: string }
  | { type: 'step'; step: number }
  | { type: 'text'; text: string }
  | { type: 'tool_call'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; id: string; name: string; output: unknown }
  | { type: 'error'; message: string }

// ── Main agent ─────────────────────────────────────────────────────

export async function runAgent(
  userMessage: string,
  ctx: AgentContext,
  previousMessages: Array<{ role: string; content: string }> = [],
  onEvent?: (evt: AgentEvent) => void
): Promise<{ text: string; toolCalls: Array<{ name: string; input: unknown; output: unknown }> }> {

  // 1. Load live workspace context
  onEvent?.({ type: 'status', message: 'Loading workspace…' })
  const workspaceCtx = await getWorkspaceContext(ctx.userId, ctx.category)

  // 2. Build system prompt: base + workspace + skill
  const skill = getSkillForCategory(ctx.category)
  const system = [BASE_SYSTEM, workspaceCtx, skill ? skill.systemPrompt : ''].join('\n\n')

  const tools: UnifiedTool[] = TOOL_DEFINITIONS.map(t => ({
    name: t.name, description: t.description, input_schema: t.input_schema as Record<string, unknown>
  }))

  // ── PHASE 1: Tool collection ──────────────────────────────────────
  // Agent plans and executes tool calls with small token budget.
  // All results gathered for clean Phase 2 synthesis.

  const collectionMessages: UnifiedMessage[] = [
    ...previousMessages.slice(-4).map(m => ({ role: m.role as UnifiedMessage['role'], content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const allToolCalls: Array<{ name: string; input: unknown; output: unknown }> = []
  const gatheredPassages: string[] = []
  const gatheredCharts: unknown[] = []
  const gatheredReports: unknown[] = []

  onEvent?.({ type: 'status', message: 'Planning…' })

  for (let step = 0; step < 8; step++) {
    onEvent?.({ type: 'step', step })

    let response
    try {
      response = await generateWithTools({
        system,
        messages: collectionMessages,
        tools,
        maxTokens: 600,  // Short: just enough to call the next tool
        onProviderChange: spec => {
          onEvent?.({ type: 'provider', provider: spec.provider, model: spec.model })
        },
      })
    } catch (e: any) {
      onEvent?.({ type: 'error', message: `Provider error in planning phase: ${e?.message || e}` })
      break
    }

    if (response.stop_reason !== 'tool_use') break

    collectionMessages.push({ role: 'assistant', content: response.text || '', tool_calls: response.tool_calls })

    for (const tc of response.tool_calls) {
      const statusMsg = {
        list_documents: 'Checking document library…',
        retrieve_chunks: 'Searching documents…',
        generate_chart: 'Building chart…',
        generate_report: 'Saving report…',
      }[tc.name] ?? `Running ${tc.name}…`

      onEvent?.({ type: 'status', message: statusMsg })
      onEvent?.({ type: 'tool_call', id: tc.id, name: tc.name, input: tc.input })

      let output: unknown
      try {
        output = await executeTool(tc.name, tc.input, { userId: ctx.userId, sessionId: ctx.sessionId, category: ctx.category })
      } catch (e) {
        output = { error: String(e) }
      }

      allToolCalls.push({ name: tc.name, input: tc.input, output })
      onEvent?.({ type: 'tool_result', id: tc.id, name: tc.name, output })

      // Collect results by type for clean synthesis
      if (tc.name === 'retrieve_chunks') {
        const passages = (output as any)?.passages ?? []
        if (passages.length > 0) {
          gatheredPassages.push(
            `### Search: "${(tc.input as any).query}"\n` +
            passages.map((p: any) =>
              `**[${p.source}]** (relevance: ${p.relevance_score})\n${p.text}`
            ).join('\n\n')
          )
        } else {
          const note = (output as any)?.note
          gatheredPassages.push(`### Search: "${(tc.input as any).query}"\nResult: ${note ?? 'No passages found'}`)
        }
      }

      if (tc.name === 'generate_chart') {
        gatheredCharts.push((output as any)?.chart ?? tc.input)
      }

      if (tc.name === 'generate_report') {
        gatheredReports.push(output)
      }

      // Keep collection context lean — just enough to plan next step
      const out = JSON.stringify(output)
      const short = tc.name === 'retrieve_chunks'
        ? `Passages found: ${(output as any)?.passages?.length ?? 0}. ${(output as any)?.note ?? ''}`
        : out.slice(0, 500)

      collectionMessages.push({ role: 'tool', content: short, tool_call_id: tc.id, tool_name: tc.name })
    }
  }

  // ── PHASE 2: Expert synthesis ──────────────────────────────────────
  // Fresh context: system + all gathered data + user question.
  // Full token budget. No history noise.

  onEvent?.({ type: 'status', message: 'Writing analysis…' })

  const dataBlock = gatheredPassages.length > 0
    ? `## DOCUMENT EVIDENCE\n\n${gatheredPassages.join('\n\n---\n\n')}`
    : '## NOTE\nNo document passages were retrieved. Explain what data is missing and what the user needs to upload.'

  const synthesisSystem = `You are FedFMMatter, an expert federal financial management analyst.

Write a COMPLETE, expert-quality analysis. Use all evidence provided. Do NOT cut off.
Structure with markdown headers. Include tables where data supports it.
Cite [filename] for every fact. Call generate_chart for every significant comparison.
${skill ? skill.systemPrompt : ''}`

  const synthesisMessages: UnifiedMessage[] = [
    {
      role: 'user',
      content: `${userMessage}\n\n${workspaceCtx}\n\n${dataBlock}`,
    },
  ]

  let finalText = ''
  try {
    const synthesis = await generateWithTools({
      system: synthesisSystem,
      messages: synthesisMessages,
      tools: tools.filter(t => t.name === 'generate_chart' || t.name === 'generate_report'),
      maxTokens: 8000,
      onProviderChange: spec => {
        onEvent?.({ type: 'provider', provider: spec.provider, model: spec.model })
      },
    })

    finalText = synthesis.text

    // Handle any charts generated during synthesis
    for (const tc of synthesis.tool_calls) {
      onEvent?.({ type: 'tool_call', id: tc.id, name: tc.name, input: tc.input })
      let out: unknown
      try { out = await executeTool(tc.name, tc.input, { userId: ctx.userId, sessionId: ctx.sessionId, category: ctx.category }) }
      catch (e) { out = { error: String(e) } }
      allToolCalls.push({ name: tc.name, input: tc.input, output: out })
      onEvent?.({ type: 'tool_result', id: tc.id, name: tc.name, output: out })
    }

    if (finalText) onEvent?.({ type: 'text', text: finalText })

  } catch (e: any) {
    const msg = e?.message || String(e)
    onEvent?.({ type: 'error', message: `Analysis failed: ${msg}` })
    finalText = `Analysis could not be completed: ${msg}`
    onEvent?.({ type: 'text', text: finalText })
  }

  // Auto-save if user asked for a report
  const wantsReport = /\b(save|report|generate report)\b/i.test(userMessage) && gatheredReports.length === 0
  if (wantsReport && finalText && finalText.length > 200) {
    try {
      const title = userMessage.replace(/\b(save|as a report|generate report)\b/gi, '').trim().slice(0, 80) || 'Analysis'
      const saved = await executeTool('generate_report', {
        title,
        category: ctx.category ?? 'budget',
        content_markdown: finalText,
      }, { userId: ctx.userId, sessionId: ctx.sessionId, category: ctx.category })
      allToolCalls.push({ name: 'generate_report', input: { title }, output: saved })
      onEvent?.({ type: 'tool_result', id: 'autosave', name: 'generate_report', output: saved })
      const note = '\n\n---\n✅ **Report saved** — available in the Reports section.'
      finalText += note
      onEvent?.({ type: 'text', text: note })
    } catch (e) {
      console.error('Auto-save failed:', e)
    }
  }

  return { text: finalText, toolCalls: allToolCalls }
}
