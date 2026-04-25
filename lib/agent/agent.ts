import { generateWithTools, type UnifiedMessage, type UnifiedTool } from '@/lib/ai/provider'
import { TOOL_DEFINITIONS, executeTool } from './tools'
import { ALL_SKILLS } from './skills'
import type { AgentContext } from '@/lib/types'

const SYSTEM = `You are FedFMMatter, an AI federal financial management analyst. Users are GS-12 to SES federal professionals.

DOCUMENT ACCESS — CRITICAL:
- To read uploaded documents, call retrieve_chunks with a natural language query. It searches ALL files automatically.
- Never ask for file names or IDs. Just search with a descriptive query.
- Call retrieve_chunks multiple times to cover different angles of a complex request.
- After getting document passages, write a thorough analysis. Do not ask for more clarification.

CHARTS:
- Call generate_chart whenever a visual would help — comparisons, rankings, time series, breakdowns.
- Be generous with charts. Users want visuals.

STYLE:
- Lead with the analytical finding. Be direct.
- Cite source filename for every fact pulled from documents.
- If retrieve_chunks returns nothing, say so clearly. Do not make up numbers.`

export type AgentEvent =
  | { type: 'status'; message: string }
  | { type: 'provider'; provider: string; model: string }
  | { type: 'step'; step: number }
  | { type: 'text'; text: string }
  | { type: 'tool_call'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; id: string; name: string; output: unknown }
  | { type: 'error'; message: string }

const TOOL_STATUS: Record<string, string> = {
  retrieve_chunks: 'Searching documents…',
  generate_chart:  'Building chart…',
  web_search:      'Searching the web…',
  generate_report: 'Saving report…',
}

export async function runAgent(
  userMessage: string,
  ctx: AgentContext,
  previousMessages: Array<{ role: string; content: string }> = [],
  onEvent?: (evt: AgentEvent) => void
): Promise<{ text: string; toolCalls: Array<{ name: string; input: unknown; output: unknown }> }> {

  const skill = ctx.category ? ALL_SKILLS.find(s => s.category === ctx.category) : null
  const system = skill ? `${SYSTEM}\n\n${skill.systemPrompt}` : SYSTEM

  const tools: UnifiedTool[] = TOOL_DEFINITIONS.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as Record<string, unknown>,
  }))

  const messages: UnifiedMessage[] = [
    ...previousMessages.slice(-4).map(m => ({ role: m.role as UnifiedMessage['role'], content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const allToolCalls: Array<{ name: string; input: unknown; output: unknown }> = []
  let finalText = ''

  onEvent?.({ type: 'status', message: 'Thinking…' })

  for (let step = 0; step < 8; step++) {
    onEvent?.({ type: 'step', step })

    let response
    try {
      response = await generateWithTools({
        system,
        messages,
        tools,
        maxTokens: 1500,
        onProviderChange: spec => {
          onEvent?.({ type: 'provider', provider: spec.provider, model: spec.model })
          onEvent?.({ type: 'status', message: `Using ${spec.model}…` })
        },
      })
    } catch (e: any) {
      onEvent?.({ type: 'error', message: e?.message || String(e) })
      break
    }

    if (response.text) {
      if (finalText === '') onEvent?.({ type: 'status', message: 'Writing analysis…' })
      finalText += response.text
      onEvent?.({ type: 'text', text: response.text })
    }

    if (response.stop_reason !== 'tool_use') break

    messages.push({ role: 'assistant', content: response.text, tool_calls: response.tool_calls })

    for (const tc of response.tool_calls) {
      onEvent?.({ type: 'status', message: TOOL_STATUS[tc.name] ?? `Running ${tc.name}…` })
      onEvent?.({ type: 'tool_call', id: tc.id, name: tc.name, input: tc.input })

      let output: unknown
      try {
        output = await executeTool(tc.name, tc.input, {
          userId: ctx.userId,
          sessionId: ctx.sessionId,
          category: ctx.category,
        })
      } catch (e) {
        output = { error: String(e) }
      }

      allToolCalls.push({ name: tc.name, input: tc.input, output })
      onEvent?.({ type: 'tool_result', id: tc.id, name: tc.name, output })

      // Keep tool output very small — context blowout is the #1 cause of hangs
      const out = JSON.stringify(output)
      const truncated = out.length > 2500 ? out.slice(0, 2500) + '…[truncated]' : out
      messages.push({ role: 'tool', content: truncated, tool_call_id: tc.id, tool_name: tc.name })
    }

    onEvent?.({ type: 'status', message: 'Thinking…' })
  }

  return { text: finalText, toolCalls: allToolCalls }
}
