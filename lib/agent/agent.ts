import { generateWithTools, type UnifiedMessage, type UnifiedTool } from '@/lib/ai/provider'
import { TOOL_DEFINITIONS, executeTool, type ToolExecutionContext } from './tools'
import { ALL_SKILLS } from './skills'
import type { AgentContext } from '@/lib/types'

// Concise base — skills add category-specific context on top
const BASE_SYSTEM = `You are FedFMMatter, an AI analyst for U.S. federal government financial management.
Your users are career federal professionals (GS-12 to SES). No preamble. Lead with the analytical point.

CRITICAL — HOW TO ACCESS DOCUMENTS:
- The user's uploaded documents are already in the knowledge base.
- To read them, call retrieve_chunks with a natural language query. It does semantic search across ALL uploaded documents automatically.
- NEVER ask the user for document IDs, file names, or document references. You do not need them.
- NEVER say you "cannot access" documents without first calling retrieve_chunks.
- When asked to analyze uploaded documents, IMMEDIATELY call retrieve_chunks with a relevant query. Do not ask clarifying questions first.
- Call retrieve_chunks multiple times with different queries to cover different aspects of a request.

Other rules:
- Use web_search for public references (GAO, CRS, Federal Register).
- Use generate_chart when visualization strengthens analysis.
- Use generate_report to save finalized deliverables.
- Never invent numbers, program names, or FAR clauses.
- If retrieve_chunks returns no results, tell the user the documents may not be indexed yet and direct them to the library page to check chunk counts.`

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
  // Only attach the one relevant skill, not all of them — saves ~1,500 tokens on Groq
  const skill = ctx.category
    ? ALL_SKILLS.find((s) => s.id === `${ctx.category}_analysis_insider` || s.category === ctx.category)
    : null
  const system = skill
    ? `${BASE_SYSTEM}\n\n${skill.systemPrompt}`
    : BASE_SYSTEM

  const tools: UnifiedTool[] = TOOL_DEFINITIONS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as Record<string, unknown>,
  }))

  // Keep history window small to avoid rate limits — last 10 messages only
  const trimmedHistory = previousMessages.slice(-10)

  const messages: UnifiedMessage[] = [
    ...trimmedHistory.map((m) => ({ role: m.role as UnifiedMessage['role'], content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const toolCalls: Array<{ name: string; input: unknown; output: unknown }> = []
  const toolCtx: ToolExecutionContext = { userId: ctx.userId, sessionId: ctx.sessionId, category: ctx.category }

  let finalText = ''
  const MAX_STEPS = 6 // reduced from 8 to keep context window manageable

  for (let step = 0; step < MAX_STEPS; step++) {
    onEvent?.({ type: 'step', step })
    const response = await generateWithTools({
      system,
      messages,
      tools,
      maxTokens: 2048, // cap per-response tokens to stay under rate limits
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

      // Truncate large tool outputs before adding to context — prevents context blowout
      const outputStr = JSON.stringify(output)
      const truncatedOutput = outputStr.length > 8000
        ? outputStr.slice(0, 8000) + '...[truncated]'
        : outputStr

      messages.push({
        role: 'tool',
        content: truncatedOutput,
        tool_call_id: tc.id,
      })
    }
  }

  return { text: finalText, toolCalls }
}
