import { generateWithTools, type UnifiedMessage, type UnifiedTool } from '@/lib/ai/provider'
import { TOOL_DEFINITIONS, executeTool } from './tools'
import { ALL_SKILLS } from './skills'
import type { AgentContext } from '@/lib/types'

const SYSTEM = `You are FedFMMatter, an AI federal financial analyst.

TO ACCESS DOCUMENTS: call retrieve_chunks with a natural language query. It searches all uploaded files automatically. Never ask the user for file names or IDs. Call it immediately when the user asks about their documents.

Call retrieve_chunks multiple times with different queries to cover all aspects of a complex request. After getting results, write a thorough analysis directly — do not ask for more clarification.

Be direct. Lead with the analytical finding. Cite the source filename for every fact you pull from documents.`

export type AgentEvent =
  | { type: 'provider'; provider: string; model: string }
  | { type: 'step'; step: number }
  | { type: 'text'; text: string }
  | { type: 'tool_call'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; id: string; name: string; output: unknown }

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

  const messages: UnifiedMessage[] = [
    ...previousMessages.slice(-6).map(m => ({ role: m.role as UnifiedMessage['role'], content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const allToolCalls: Array<{ name: string; input: unknown; output: unknown }> = []
  let finalText = ''

  for (let step = 0; step < 8; step++) {
    onEvent?.({ type: 'step', step })
    const response = await generateWithTools({
      system, messages, tools, maxTokens: 2048,
      onProviderChange: spec => onEvent?.({ type: 'provider', provider: spec.provider, model: spec.model }),
    })

    if (response.text) { finalText += response.text; onEvent?.({ type: 'text', text: response.text }) }
    if (response.stop_reason !== 'tool_use') break

    messages.push({ role: 'assistant', content: response.text, tool_calls: response.tool_calls })

    for (const tc of response.tool_calls) {
      onEvent?.({ type: 'tool_call', id: tc.id, name: tc.name, input: tc.input })
      let output: unknown
      try { output = await executeTool(tc.name, tc.input, { userId: ctx.userId, sessionId: ctx.sessionId, category: ctx.category }) }
      catch (e) { output = { error: String(e) } }
      allToolCalls.push({ name: tc.name, input: tc.input, output })
      onEvent?.({ type: 'tool_result', id: tc.id, name: tc.name, output })

      // Hard cap at 3000 chars per tool result to stay under Groq TPM limits
      const out = JSON.stringify(output)
      messages.push({ role: 'tool', content: out.slice(0, 3000), tool_call_id: tc.id, tool_name: tc.name })
    }
  }

  return { text: finalText, toolCalls: allToolCalls }
}
