import { generateWithTools, type UnifiedMessage, type UnifiedTool } from '@/lib/ai/provider'
import { TOOL_DEFINITIONS, executeTool, type ToolExecutionContext } from './tools'
import { ALL_SKILLS } from './skills'
import type { AgentContext } from '@/lib/types'

const BASE_SYSTEM = `You are FedFMMatter, an AI analyst for U.S. federal government financial management.
Your users are career federal professionals (GS-12 to SES). No preamble. Lead with the analytical point.

════ HOW TO USE YOUR TOOLS ════

retrieve_chunks is a SEMANTIC SEARCH engine over ALL uploaded documents.
• Call it immediately with a natural language query — e.g. "FY27 procurement by service", "RDTE appropriation structure"
• DO NOT ask the user which files to search. DO NOT ask for document IDs or filenames.
• The search finds relevant passages automatically across every uploaded document.
• Call it multiple times with different queries to cover different aspects of a complex request.
• If it returns empty results, report what the note field says — do not make up data.

When the user asks to analyze their documents: CALL retrieve_chunks FIRST. Then write the analysis.
Never ask clarifying questions before making at least one retrieve_chunks call.

════ OTHER RULES ════
• Use web_search for public references (GAO, CRS, Federal Register, comptroller.defense.gov).
• Use generate_chart for visualizations.
• Use generate_report to save finalized deliverables.
• Never invent numbers, PE numbers, FAR clauses, or program names.
• Cite the source filename when quoting retrieved passages.`

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
  // Attach only the most relevant skill for this category
  const skill = ctx.category
    ? ALL_SKILLS.find(s => s.category === ctx.category)
    : null
  const system = skill ? `${BASE_SYSTEM}\n\n${skill.systemPrompt}` : BASE_SYSTEM

  const tools: UnifiedTool[] = TOOL_DEFINITIONS.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as Record<string, unknown>,
  }))

  // Keep history window tight to avoid rate limits
  const trimmedHistory = previousMessages.slice(-8)

  const messages: UnifiedMessage[] = [
    ...trimmedHistory.map(m => ({ role: m.role as UnifiedMessage['role'], content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const toolCalls: Array<{ name: string; input: unknown; output: unknown }> = []
  const toolCtx: ToolExecutionContext = {
    userId: ctx.userId,
    sessionId: ctx.sessionId,
    category: ctx.category,
  }

  let finalText = ''
  const MAX_STEPS = 8

  for (let step = 0; step < MAX_STEPS; step++) {
    onEvent?.({ type: 'step', step })

    const response = await generateWithTools({
      system,
      messages,
      tools,
      maxTokens: 2048,
      onProviderChange: spec => onEvent?.({ type: 'provider', provider: spec.provider, model: spec.model }),
    })

    if (response.text) {
      finalText += response.text
      onEvent?.({ type: 'text', text: response.text })
    }

    if (response.stop_reason !== 'tool_use') break

    // Append assistant message with tool calls
    messages.push({
      role: 'assistant',
      content: response.text,
      tool_calls: response.tool_calls,
    })

    // Execute each tool and append result
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

      // Truncate large outputs to avoid context blowout
      const outputStr = JSON.stringify(output)
      const truncated = outputStr.length > 6000
        ? outputStr.slice(0, 6000) + '…[truncated for brevity]'
        : outputStr

      messages.push({
        role: 'tool',
        content: truncated,
        tool_call_id: tc.id,
        tool_name: tc.name,   // ← CRITICAL: Gemini uses this in functionResponse.name
      })
    }
  }

  return { text: finalText, toolCalls }
}
