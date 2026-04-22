import Anthropic from '@anthropic-ai/sdk'
import { TOOL_DEFINITIONS, executeTool, type ToolExecutionContext } from './tools'
import { getSkillById, getSkillsForCategory } from './skills'
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
- Treat uploaded material as potentially sensitive — do not repeat personally identifiable or procurement-sensitive content unnecessarily`

export async function runAgent(
  userMessage: string,
  ctx: AgentContext,
  previousMessages: Array<{ role: string; content: string }> = [],
  onEvent?: (evt: AgentEvent) => void
): Promise<{ text: string; toolCalls: Array<{ name: string; input: unknown; output: unknown }> }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const skills = ctx.category ? getSkillsForCategory(ctx.category) : []
  const skillPrompts = skills.map((s) => `# Skill: ${s.name}\n${s.systemPrompt}`).join('\n\n')
  const systemPrompt = `${BASE_SYSTEM}\n\n${skillPrompts}`

  const messages: Anthropic.Messages.MessageParam[] = [
    ...previousMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const toolCalls: Array<{ name: string; input: unknown; output: unknown }> = []
  const toolCtx: ToolExecutionContext = { userId: ctx.userId, sessionId: ctx.sessionId, category: ctx.category }

  let finalText = ''
  const MAX_STEPS = 8

  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-opus-4-7',
      max_tokens: 8192,
      system: systemPrompt,
      tools: TOOL_DEFINITIONS,
      messages,
    })

    onEvent?.({ type: 'step', step, stop_reason: response.stop_reason })

    const assistantContent: Anthropic.Messages.ContentBlock[] = []
    for (const block of response.content) {
      assistantContent.push(block)
      if (block.type === 'text') {
        finalText += block.text
        onEvent?.({ type: 'text', text: block.text })
      }
    }
    messages.push({ role: 'assistant', content: assistantContent })

    if (response.stop_reason !== 'tool_use') break

    const toolUses = response.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
    )
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []
    for (const tu of toolUses) {
      onEvent?.({ type: 'tool_call', name: tu.name, input: tu.input })
      try {
        const output = await executeTool(tu.name, tu.input, toolCtx)
        toolCalls.push({ name: tu.name, input: tu.input, output })
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify(output).slice(0, 100_000),
        })
        onEvent?.({ type: 'tool_result', name: tu.name, output })
      } catch (err) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify({ error: String(err) }),
          is_error: true,
        })
      }
    }
    messages.push({ role: 'user', content: toolResults })
  }

  return { text: finalText, toolCalls }
}

export type AgentEvent =
  | { type: 'step'; step: number; stop_reason: string | null }
  | { type: 'text'; text: string }
  | { type: 'tool_call'; name: string; input: unknown }
  | { type: 'tool_result'; name: string; output: unknown }
