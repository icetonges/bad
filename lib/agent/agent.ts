import { generateWithTools, type UnifiedMessage, type UnifiedTool } from '@/lib/ai/provider'
import { TOOL_DEFINITIONS, executeTool } from './tools'
import { ALL_SKILLS } from './skills'
import type { AgentContext } from '@/lib/types'

const SYSTEM = `You are FedFMMatter, an AI federal financial management analyst.
Users are GS-12 to SES career federal professionals.

DOCUMENT ACCESS: Call retrieve_chunks with a natural language query to search uploaded files.
Never ask for file names or IDs. Call it multiple times for complex requests.
After gathering data, write a thorough, complete analysis. Do not cut off mid-sentence.

CHARTS: Call generate_chart freely — users want visuals alongside the analysis.

STYLE: Lead with findings. Cite source filename for every fact. Never invent numbers.`

const SYNTHESIS_SYSTEM = `You are FedFMMatter, an expert federal financial management analyst.

Write a COMPLETE, thorough response based on the data provided. 
Do NOT cut off. Write until the analysis is genuinely finished.
Use markdown headers, tables, and bullet points where they aid clarity.
Cite the source filename for every fact you use.`

export type AgentEvent =
  | { type: 'status'; message: string }
  | { type: 'provider'; provider: string; model: string }
  | { type: 'step'; step: number }
  | { type: 'text'; text: string }
  | { type: 'tool_call'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; id: string; name: string; output: unknown }
  | { type: 'error'; message: string }

export async function runAgent(
  userMessage: string,
  ctx: AgentContext,
  previousMessages: Array<{ role: string; content: string }> = [],
  onEvent?: (evt: AgentEvent) => void
): Promise<{ text: string; toolCalls: Array<{ name: string; input: unknown; output: unknown }> }> {

  const skill = ctx.category ? ALL_SKILLS.find(s => s.category === ctx.category) : null
  const system = skill ? `${SYSTEM}\n\n${skill.systemPrompt}` : SYSTEM

  const tools: UnifiedTool[] = TOOL_DEFINITIONS.map(t => ({
    name: t.name, description: t.description, input_schema: t.input_schema as Record<string, unknown>
  }))

  // ── PHASE 1: Tool collection ──────────────────────────────────────
  // Small context window, just enough to decide what tools to call.
  // We collect ALL tool results before writing the final answer.

  const collectionMessages: UnifiedMessage[] = [
    { role: 'user', content: userMessage },
  ]

  const allToolCalls: Array<{ name: string; input: unknown; output: unknown }> = []
  const gatheredData: string[] = []
  const chartSpecs: unknown[] = []

  onEvent?.({ type: 'status', message: 'Planning analysis…' })

  for (let step = 0; step < 6; step++) {
    onEvent?.({ type: 'step', step })

    let response
    try {
      response = await generateWithTools({
        system,
        messages: collectionMessages,
        tools,
        maxTokens: 512, // Only need short responses to call tools
        onProviderChange: spec => {
          onEvent?.({ type: 'provider', provider: spec.provider, model: spec.model })
        },
      })
    } catch (e: any) {
      onEvent?.({ type: 'error', message: `Provider error: ${e?.message || e}` })
      break
    }

    // If model tries to write text in the tool-collection phase, ignore it
    // — we'll get a better answer in Phase 2 with all the data
    if (response.stop_reason !== 'tool_use') break

    collectionMessages.push({
      role: 'assistant',
      content: response.text || '',
      tool_calls: response.tool_calls,
    })

    for (const tc of response.tool_calls) {
      const statusMsg = {
        retrieve_chunks: 'Searching documents…',
        generate_chart: 'Building chart…',
        web_search: 'Searching web…',
        generate_report: 'Saving report…',
      }[tc.name] ?? `Running ${tc.name}…`

      onEvent?.({ type: 'status', message: statusMsg })
      onEvent?.({ type: 'tool_call', id: tc.id, name: tc.name, input: tc.input })

      let output: unknown
      try {
        output = await executeTool(tc.name, tc.input, {
          userId: ctx.userId, sessionId: ctx.sessionId, category: ctx.category,
        })
      } catch (e) {
        output = { error: String(e) }
      }

      allToolCalls.push({ name: tc.name, input: tc.input, output })
      onEvent?.({ type: 'tool_result', id: tc.id, name: tc.name, output })

      // Collect charts separately so we can emit them
      if (tc.name === 'generate_chart') {
        const spec = (output as any)?.chart ?? tc.input
        if (spec) chartSpecs.push(spec)
      }

      // Gather document passages for the synthesis prompt
      if (tc.name === 'retrieve_chunks') {
        const passages = (output as any)?.passages ?? []
        if (passages.length > 0) {
          const block = passages.map((p: any) =>
            `[${p.source}]\n${String(p.text).slice(0, 800)}`
          ).join('\n\n')
          gatheredData.push(`Query: "${(tc.input as any).query}"\n${block}`)
        } else {
          const note = (output as any)?.note
          if (note) gatheredData.push(`Query: "${(tc.input as any).query}"\nResult: ${note}`)
        }
      }

      // Keep tool result short in collection context
      const out = JSON.stringify(output).slice(0, 1000)
      collectionMessages.push({
        role: 'tool', content: out, tool_call_id: tc.id, tool_name: tc.name,
      })
    }
  }

  // ── PHASE 2: Full synthesis ────────────────────────────────────────
  // Fresh context: just system + the gathered data + the user question.
  // No accumulated history. Full token budget for the answer.

  onEvent?.({ type: 'status', message: 'Writing analysis…' })

  let dataContext = ''
  if (gatheredData.length > 0) {
    dataContext = `\n\n## Retrieved document passages\n\n${gatheredData.join('\n\n---\n\n')}`
  } else {
    dataContext = '\n\n## Note\nNo document passages were retrieved. Base the response on your knowledge and be explicit that no uploaded documents were found.'
  }

  const synthesisMessages: UnifiedMessage[] = [
    { role: 'user', content: `${userMessage}${dataContext}` },
  ]

  let finalText = ''
  try {
    const synthesis = await generateWithTools({
      system: SYNTHESIS_SYSTEM,
      messages: synthesisMessages,
      tools: [], // No tools in synthesis — just write
      maxTokens: 8000,
      onProviderChange: spec => {
        onEvent?.({ type: 'provider', provider: spec.provider, model: spec.model })
      },
    })
    finalText = synthesis.text
    if (finalText) onEvent?.({ type: 'text', text: finalText })
  } catch (e: any) {
    onEvent?.({ type: 'error', message: `Synthesis failed: ${e?.message || e}` })
  }

  return { text: finalText, toolCalls: allToolCalls }
}
