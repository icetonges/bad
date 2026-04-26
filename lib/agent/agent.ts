import { generateWithTools, type UnifiedMessage, type UnifiedTool } from '@/lib/ai/provider'
import { TOOL_DEFINITIONS, executeTool } from './tools'
import { getSkillForCategory } from './skills'
import { sql, DEFAULT_WORKSPACE_ID } from '@/lib/db/neon'
import type { AgentContext } from '@/lib/types'

// ── Workspace context ──────────────────────────────────────────────
async function getWorkspaceContext(userId: string): Promise<string> {
  try {
    const wsId = userId || DEFAULT_WORKSPACE_ID
    const rows = await sql`
      select d.filename, d.category, d.size_bytes,
             count(c.id)::int as chunk_count
      from public.documents d
      left join public.chunks c on c.document_id = d.id
      where d.workspace_id = ${wsId}::uuid
      group by d.id order by d.category, d.created_at desc
    `
    if (!rows.length) return '## WORKSPACE: No documents uploaded yet.'

    const indexed = rows.filter((r: any) => (r.chunk_count ?? 0) > 0)
    const unindexed = rows.filter((r: any) => (r.chunk_count ?? 0) === 0)
    const byCategory: Record<string, any[]> = {}
    for (const r of rows as any[]) {
      const cat = r.category as string
      if (!byCategory[cat]) byCategory[cat] = []
      byCategory[cat].push(`${r.filename} (${r.chunk_count ?? 0} chunks, ${Math.round(r.size_bytes/1024)}KB)`)
    }

    let ctx = `## WORKSPACE — ${rows.length} documents (${indexed.length} searchable, ${unindexed.length} not indexed)\n`
    for (const [cat, files] of Object.entries(byCategory)) {
      ctx += `### ${cat.toUpperCase()}: ${files.join(' | ')}\n`
    }
    if (unindexed.length) {
      ctx += `⚠️ NOT SEARCHABLE: ${unindexed.map((r: any) => r.filename).join(', ')} — needs Re-embed in library\n`
    }
    ctx += `\nUse retrieve_chunks to search. Never ask for file names or IDs.\n`
    ctx += `When user asks how many documents: answer from above directly.\n`
    return ctx
  } catch {
    return '## WORKSPACE: Could not load context. Use retrieve_chunks to search.'
  }
}

// ── Generate search plan ───────────────────────────────────────────
// For complex requests, the agent first generates a list of targeted
// queries before executing any — ensures comprehensive coverage.
async function generateSearchPlan(
  userMessage: string,
  systemContext: string,
  tools: UnifiedTool[],
  onEvent?: (evt: AgentEvent) => void
): Promise<string[]> {
  const planPrompt = `Based on this request, list 8-15 SPECIFIC search queries to run against the document knowledge base.
Each query should target a different specific aspect. Return ONLY a JSON array of strings, nothing else.

Request: "${userMessage}"

Example format: ["query 1", "query 2", "query 3"]

For audit/material weakness requests, include queries like:
"material weakness 1 financial management systems", "material weakness configuration management",
"material weakness access controls ICAM", "material weakness fund balance treasury FBWT",
"material weakness inventory stockpile", "material weakness PP&E property plant equipment",
"material weakness unsupported accounting adjustments", "material weakness intragovernmental",
"disclaimer of opinion basis", "significant deficiency", "noncompliance antideficiency act"

Return only the JSON array.`

  try {
    const { generateWithTools: gen } = await import('@/lib/ai/provider')
    const res = await gen({
      system: systemContext,
      messages: [{ role: 'user', content: planPrompt }],
      tools: [],
      maxTokens: 800,
      onProviderChange: spec => onEvent?.({ type: 'provider', provider: spec.provider, model: spec.model }),
    })
    const text = res.text.trim()
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      const parsed = JSON.parse(match[0])
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  // Fallback — generic queries
  return ['material weakness findings', 'audit opinion disclaimer', 'internal control deficiency',
          'noncompliance findings', 'significant deficiency', 'corrective action plan']
}

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

  onEvent?.({ type: 'status', message: 'Loading workspace…' })
  const workspaceCtx = await getWorkspaceContext(ctx.userId)
  const skill = getSkillForCategory(ctx.category)

  const systemBase = `You are FedFMMatter — an expert AI federal financial management analyst.
Users are GS-12 to SES career federal professionals. Be direct. Lead with findings.

## OPERATING RULES
- You KNOW what documents are uploaded (see WORKSPACE below)
- Use retrieve_chunks to search them — call it 8-15 times for comprehensive analysis
- list_documents gives the full file inventory
- generate_chart for every significant numerical comparison
- generate_report to save completed analyses
- NEVER say you cannot access documents without first searching
- NEVER make up numbers. NEVER ask for file names or IDs.
- When asked to list all [findings/weaknesses/etc]: list everything you know from domain knowledge PLUS what documents confirm

${workspaceCtx}
${skill ? skill.systemPrompt : ''}`

  const tools: UnifiedTool[] = TOOL_DEFINITIONS.map(t => ({
    name: t.name, description: t.description, input_schema: t.input_schema as Record<string, unknown>
  }))

  // Phase 1 only gets search + chart tools. generate_report fires AFTER synthesis with real content.
  const phase1Tools = tools.filter(t => t.name !== 'generate_report')

  const allToolCalls: Array<{ name: string; input: unknown; output: unknown }> = []
  const gatheredPassages: string[] = []

  // ── SAVE-ONLY: user just wants to save the previous analysis, no new work needed ──
  const saveOnlyPattern = /^\s*(please\s+)?(save|save (this|it|that|the analysis|the response|the output|as report|as a report)|store (this|it|that)|export (this|it)|create (a )?report (from this|from that)?|generate (a )?report (from this|from that)?|save (and )?export)\s*[.!]?\s*$/i
  const isSaveOnly = saveOnlyPattern.test(userMessage.trim())
  if (isSaveOnly) {
    const lastAssistant = [...previousMessages].reverse().find(m => m.role === 'assistant' && m.content && m.content.length > 100)
    if (lastAssistant) {
      onEvent?.({ type: 'status', message: 'Saving previous analysis…' })
      const h1 = lastAssistant.content.match(/^#\s+(.+)$/m)?.[1]?.trim()
      const h2 = lastAssistant.content.match(/^##\s+(.+)$/m)?.[1]?.trim()
      const firstLine = lastAssistant.content.replace(/[#*`_]/g, '').split('\n').find(l => l.trim().length > 15)?.trim()
      const title = (h1 || h2 || firstLine || 'Analysis').slice(0, 100)

      const saved = await executeTool('generate_report', {
        title,
        category: ctx.category ?? 'budget',
        content_markdown: lastAssistant.content,
      }, { userId: ctx.userId, sessionId: ctx.sessionId, category: ctx.category })

      const tc = { name: 'generate_report', input: { title }, output: saved }
      onEvent?.({ type: 'tool_call', id: 'save_only', name: 'generate_report', input: { title } })
      onEvent?.({ type: 'tool_result', id: 'save_only', name: 'generate_report', output: saved })

      const reply = `✅ **Report saved:** "${title}"\n\nFind it in the Reports section — no content was re-generated.`
      onEvent?.({ type: 'text', text: reply })
      return { text: reply, toolCalls: [tc] }
    }
  }

  // ── Determine if this is a comprehensive analysis request ──────────
  const isExhaustive = /list all|complete list|all findings|all weakness|all material|comprehensive|exhaustive|every|enumerate|full list/i.test(userMessage)
  const isSimple = /how many|what files|list documents|what documents/i.test(userMessage)

  // ── SIMPLE QUERIES: Answer directly from workspace context ─────────
  if (isSimple && !isExhaustive) {
    onEvent?.({ type: 'status', message: 'Answering from workspace…' })
    const simpleMessages: UnifiedMessage[] = [
      ...previousMessages.slice(-4).map(m => ({ role: m.role as UnifiedMessage['role'], content: m.content })),
      { role: 'user', content: userMessage },
    ]
    try {
      const res = await generateWithTools({
        system: systemBase,
        messages: simpleMessages,
        tools: phase1Tools,
        maxTokens: 2000,
        onProviderChange: spec => onEvent?.({ type: 'provider', provider: spec.provider, model: spec.model }),
      })
      if (res.text) { onEvent?.({ type: 'text', text: res.text }); return { text: res.text, toolCalls: [] } }
    } catch (e: any) {
      onEvent?.({ type: 'error', message: String(e) })
    }
  }

  // ── PHASE 1: Generate search plan ─────────────────────────────────
  onEvent?.({ type: 'status', message: 'Planning research…' })

  let searchQueries: string[] = []

  if (isExhaustive) {
    // For exhaustive requests, generate a targeted search plan
    searchQueries = await generateSearchPlan(userMessage, systemBase, phase1Tools, onEvent)
    onEvent?.({ type: 'status', message: `Running ${searchQueries.length} targeted searches…` })
  } else {
    // Let the model decide what to search via normal tool-call loop
    const planMessages: UnifiedMessage[] = [
      ...previousMessages.slice(-2).map(m => ({ role: m.role as UnifiedMessage['role'], content: m.content })),
      { role: 'user', content: userMessage },
    ]

    for (let step = 0; step < 10; step++) {
      onEvent?.({ type: 'step', step })
      let response
      try {
        response = await generateWithTools({
          system: systemBase,
          messages: planMessages,
          tools: phase1Tools,
          maxTokens: 500,
          onProviderChange: spec => onEvent?.({ type: 'provider', provider: spec.provider, model: spec.model }),
        })
      } catch (e: any) {
        onEvent?.({ type: 'error', message: `Planning error: ${e?.message}` }); break
      }

      if (response.stop_reason !== 'tool_use') break
      planMessages.push({ role: 'assistant', content: response.text || '', tool_calls: response.tool_calls })

      for (const tc of response.tool_calls) {
        onEvent?.({ type: 'status', message: { retrieve_chunks: 'Searching…', generate_chart: 'Charting…', list_documents: 'Listing…', generate_report: 'Saving…' }[tc.name] ?? tc.name })
        onEvent?.({ type: 'tool_call', id: tc.id, name: tc.name, input: tc.input })

        let output: unknown
        try { output = await executeTool(tc.name, tc.input, { userId: ctx.userId, sessionId: ctx.sessionId, category: ctx.category }) }
        catch (e) { output = { error: String(e) } }

        allToolCalls.push({ name: tc.name, input: tc.input, output })
        onEvent?.({ type: 'tool_result', id: tc.id, name: tc.name, output })

        if (tc.name === 'retrieve_chunks') {
          const passages = (output as any)?.passages ?? []
          if (passages.length > 0) {
            gatheredPassages.push(`### Search: "${(tc.input as any).query}"\n` +
              passages.map((p: any) => `**[${p.source}]** (score ${p.relevance_score})\n${p.text}`).join('\n\n'))
          }
        }

        const short = tc.name === 'retrieve_chunks'
          ? `Found ${(output as any)?.passages?.length ?? 0} passages.`
          : JSON.stringify(output).slice(0, 300)
        planMessages.push({ role: 'tool', content: short, tool_call_id: tc.id, tool_name: tc.name })
      }
    }
  }

  // ── Execute pre-planned exhaustive searches ───────────────────────
  if (searchQueries.length > 0) {
    for (let i = 0; i < searchQueries.length; i++) {
      const q = searchQueries[i]
      onEvent?.({ type: 'status', message: `Searching (${i+1}/${searchQueries.length}): ${q.slice(0, 50)}…` })
      const id = `planned_${i}`
      onEvent?.({ type: 'tool_call', id, name: 'retrieve_chunks', input: { query: q, category: ctx.category, limit: 12 } })

      let output: unknown
      try {
        output = await executeTool('retrieve_chunks', { query: q, category: ctx.category, limit: 12 }, { userId: ctx.userId, sessionId: ctx.sessionId, category: ctx.category })
      } catch (e) { output = { error: String(e) } }

      allToolCalls.push({ name: 'retrieve_chunks', input: { query: q }, output })
      onEvent?.({ type: 'tool_result', id, name: 'retrieve_chunks', output })

      const passages = (output as any)?.passages ?? []
      if (passages.length > 0) {
        gatheredPassages.push(`### Search: "${q}"\n` +
          passages.map((p: any) => `**[${p.source}]** (score ${p.relevance_score})\n${p.text}`).join('\n\n'))
      }
    }
  }

  // ── PHASE 2: Pure text synthesis — no tools, no interruptions ─────
  // Charts are already collected from Phase 1.
  // We write text only. If max_tokens, we ask the model to continue.
  onEvent?.({ type: 'status', message: 'Writing analysis…' })

  const evidenceBlock = gatheredPassages.length > 0
    ? `## DOCUMENT EVIDENCE (${gatheredPassages.length} search results)\n\n${gatheredPassages.join('\n\n---\n\n')}`
    : `## NOTE: No document passages found. Answer from domain knowledge in your system prompt. State clearly which facts come from domain knowledge vs uploaded documents.`

  const synthesisSystem = `You are FedFMMatter, an expert federal financial management analyst.

Write a COMPLETE response. Use every piece of evidence provided. Do not stop early.
Use markdown headers and tables. Cite [filename] for every document fact.
Distinguish "From [filename]:" vs "From domain knowledge:".

${skill ? skill.systemPrompt : ''}

CRITICAL: List ALL 26 material weaknesses when asked. If documents only partially confirm them,
list all 26 and note which are confirmed by uploaded documents.
Use a DESCRIPTIVE title in generate_report — never the user's raw instruction text.`

  const synthesisMessages: UnifiedMessage[] = [{
    role: 'user',
    content: `${userMessage}\n\n${workspaceCtx}\n\n${evidenceBlock}`,
  }]

  let finalText = ''

  // Loop handles two cases: tool_use (chart/report mid-response) and max_tokens (response too long)
  for (let round = 0; round < 10; round++) {
    let synthesis
    try {
      synthesis = await generateWithTools({
        system: synthesisSystem,
        messages: synthesisMessages,
        tools: [],          // ← NO tools in synthesis. Zero interruptions.
        maxTokens: 8000,
        onProviderChange: spec => onEvent?.({ type: 'provider', provider: spec.provider, model: spec.model }),
      })
    } catch (e: any) {
      const msg = e?.message || String(e)
      onEvent?.({ type: 'error', message: `Synthesis error: ${msg}` })
      if (!finalText) { finalText = `Error: ${msg}`; onEvent?.({ type: 'text', text: finalText }) }
      break
    }

    if (synthesis.text) {
      finalText += synthesis.text
      onEvent?.({ type: 'text', text: synthesis.text })
    }

    if (synthesis.stop_reason === 'end_turn') break  // Model finished naturally ✓

    if (synthesis.stop_reason === 'max_tokens') {
      // Response hit token limit — ask model to continue from where it stopped
      synthesisMessages.push({ role: 'assistant', content: synthesis.text || '' })
      synthesisMessages.push({ role: 'user', content: 'Continue writing exactly where you left off. Do not repeat anything.' })
      onEvent?.({ type: 'status', message: 'Continuing…' })
      continue
    }

    // Any other stop reason (error, etc.) — exit
    break
  }

  // Auto-save: only when user explicitly asks to save, not just mentions "report"
  const alreadySaved = allToolCalls.some(tc => tc.name === 'generate_report' && (tc.output as any)?.ok)
  const wantsReport = /\b(save (this |it |the |as |the analysis |as a )?(report|analysis)|save report|generate report|create report|store (this|it)|export (this|it) as report)\b/i.test(userMessage)

  if (wantsReport && !alreadySaved && finalText.length > 100) {
    try {
      // Title: always use the first heading from the response — never parse the user message
      const h1 = finalText.match(/^#\s+(.+)$/m)?.[1]?.trim()
      const h2 = finalText.match(/^##\s+(.+)$/m)?.[1]?.trim()
      const firstBold = finalText.match(/^\*\*(.+?)\*\*/m)?.[1]?.trim()
      const firstLine = finalText.replace(/[#*`_]/g, '').split('\n').find(l => l.trim().length > 15)?.trim()
      const title = (h1 || h2 || firstBold || firstLine || 'Analysis').slice(0, 100)

      const saved = await executeTool('generate_report', {
        title,
        category: ctx.category ?? 'budget',
        content_markdown: finalText,
      }, { userId: ctx.userId, sessionId: ctx.sessionId, category: ctx.category })

      allToolCalls.push({ name: 'generate_report', input: { title }, output: saved })
      onEvent?.({ type: 'tool_result', id: 'autosave', name: 'generate_report', output: saved })
      const note = `\n\n---\n✅ **Report saved:** "${title}"`
      finalText += note
      onEvent?.({ type: 'text', text: note })
    } catch (e) {
      console.error('Auto-save failed:', e)
    }
  }

  return { text: finalText, toolCalls: allToolCalls }
}
