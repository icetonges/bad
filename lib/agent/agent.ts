import { generateWithTools, type UnifiedMessage, type UnifiedTool } from '@/lib/ai/provider'
import { TOOL_DEFINITIONS, executeTool, type ToolExecutionContext } from './tools'
import { getSkillsForCategory } from './skills'
import type { AgentContext } from '@/lib/types'

const BASE_SYSTEM = `You are fedAnalyst, an AI analyst for U.S. federal government budget, audit, accounting, and contract work.

Your users are career federal professionals — GS-12 through SES. They have deep domain expertise. Do not explain basics. Lead with the analytical point. Cite sources.

When producing analysis:
- Use the retrieve_chunks tool to ground claims in the user's uploaded documents
- Use web_search for public reference material (GAO, CRS, Federal Register)
- Use python_analysis for anything beyond trivial arithmetic
- Use generate_chart when visualization strengthens the analysis
- Use generate_report to save finalized deliverables

Integrity rules:
- Never invent numbers, program names, FAR clauses, or legal citations
- Distinguish clearly between what the source material states and what you are inferring
- When source material is insufficient, say so rather than fill gaps
- Treat uploaded material as potentially sensitive — do not repeat PII or procurement-sensitive content unnecessarily`

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
  const skills = ctx.category ? getSkillsForCategory(ctx.category) : []
  const skillPrompts = skills.map((s) => `# Skill: ${s.name}\n${s.systemPrompt}`).join('\n\n')
  const system = `${BASE_SYSTEM}\n\n${skillPrompts}`

  const tools: UnifiedTool[] = TOOL_DEFINITIONS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as Record<string, unknown>,
  }))

  const messages: UnifiedMessage[] = [
    ...previousMessages.map((m) => ({ role: m.role as UnifiedMessage['role'], content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const toolCalls: Array<{ name: string; input: unknown; output: unknown }> = []
  const toolCtx: ToolExecutionContext = { userId: ctx.userId, sessionId: ctx.sessionId, category: ctx.category }

  let finalText = ''
  const MAX_STEPS = 8

  for (let step = 0; step < MAX_STEPS; step++) {
    onEvent?.({ type: 'step', step })
    const response = await generateWithTools({
      system,
      messages,
      tools,
      onProviderChange: (spec) => onEvent?.({ type: 'provider', provider: spec.provider, model: spec.model }),
    })

    if (response.text) {
      finalText += response.text
      onEvent?.({ type: 'text', text: response.text })
    }

    if (response.stop_reason !== 'tool_use') break

    messages.push({ role: 'assistant', content: response.text, tool_calls: response.tool_calls })

    for (const tc of response.tool_calls) {
      onEvent?.({ type: 'tool_call', id: tc.id, name: tc.name, input: tc.input })
      let output: unknown
      try {
        output = await executeTool(tc.name, tc.input, toolCtx)
      } catch (e) {
        output = { error: String(e) }
      }
      toolCalls.push({ name: tc.name, input: tc.input, output })
      onEvent?.({ type: 'tool_result', id: tc.id, name: tc.name, output })
      messages.push({
        role: 'tool',
        content: JSON.stringify(output).slice(0, 100_000),
        tool_call_id: tc.id,
      })
    }
  }

  return { text: finalText, toolCalls }
}
