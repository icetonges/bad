/**
 * Provider-agnostic AI interface with failover waterfall.
 *
 * Priority:
 *   1. Gemini 2.5 Flash Lite   (Google)   — fastest + cheapest
 *   2. Llama 3.3 70B Versatile (Groq)     — fallback
 *   3. Llama 3.1 8B Instant    (Groq)     — fallback
 *   4. Gemini 2.0 Flash        (Google)   — last resort
 *
 * Both providers support OpenAI-compatible tool-use schemas, which we
 * normalize to here. Gemini uses its native REST API; Groq uses the
 * OpenAI-compatible /chat/completions endpoint.
 */

export type UnifiedRole = 'system' | 'user' | 'assistant' | 'tool'

export interface UnifiedMessage {
  role: UnifiedRole
  content: string
  tool_calls?: Array<{ id: string; name: string; input: Record<string, unknown> }>
  tool_call_id?: string
}

export interface UnifiedTool {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export interface UnifiedResponse {
  text: string
  tool_calls: Array<{ id: string; name: string; input: Record<string, unknown> }>
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | 'error'
  provider: string
  model: string
}

interface ProviderSpec {
  id: string
  name: string
  provider: 'google' | 'groq'
  model: string
  envKey: string
}

export const MODEL_WATERFALL: ProviderSpec[] = [
  { id: 'gemini-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'google', model: 'gemini-2.5-flash-lite', envKey: 'GOOGLE_API_KEY' },
  { id: 'llama-70b', name: 'Llama 3.3 70B Versatile', provider: 'groq', model: 'llama-3.3-70b-versatile', envKey: 'GROQ_API_KEY' },
  { id: 'llama-8b', name: 'Llama 3.1 8B Instant', provider: 'groq', model: 'llama-3.1-8b-instant', envKey: 'GROQ_API_KEY' },
  { id: 'gemini-flash', name: 'Gemini 2.0 Flash', provider: 'google', model: 'gemini-2.0-flash', envKey: 'GOOGLE_API_KEY' },
]

export async function generateWithTools(params: {
  system: string
  messages: UnifiedMessage[]
  tools: UnifiedTool[]
  maxTokens?: number
  onProviderChange?: (spec: ProviderSpec) => void
}): Promise<UnifiedResponse> {
  const errors: Array<{ spec: ProviderSpec; error: string }> = []

  for (const spec of MODEL_WATERFALL) {
    const apiKey = process.env[spec.envKey]
    if (!apiKey) {
      errors.push({ spec, error: `${spec.envKey} not set` })
      continue
    }
    params.onProviderChange?.(spec)
    try {
      if (spec.provider === 'google') {
        return await callGemini(spec, apiKey, params)
      } else {
        return await callGroq(spec, apiKey, params)
      }
    } catch (e: any) {
      errors.push({ spec, error: String(e?.message || e) })
      continue
    }
  }

  throw new Error('All providers failed:\n' + errors.map((e) => `  [${e.spec.id}] ${e.error}`).join('\n'))
}

// -------------------- Gemini --------------------

async function callGemini(
  spec: ProviderSpec,
  apiKey: string,
  params: { system: string; messages: UnifiedMessage[]; tools: UnifiedTool[]; maxTokens?: number }
): Promise<UnifiedResponse> {
  const contents: any[] = []
  for (const m of params.messages) {
    if (m.role === 'system') continue
    if (m.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: m.content }] })
    } else if (m.role === 'assistant') {
      const parts: any[] = []
      if (m.content) parts.push({ text: m.content })
      if (m.tool_calls) {
        for (const tc of m.tool_calls) {
          parts.push({ functionCall: { name: tc.name, args: tc.input } })
        }
      }
      contents.push({ role: 'model', parts })
    } else if (m.role === 'tool') {
      contents.push({
        role: 'user',
        parts: [{
          functionResponse: {
            name: m.tool_call_id || 'tool',
            response: { content: safeJsonParse(m.content) },
          },
        }],
      })
    }
  }

  const tools = params.tools.length ? [{
    functionDeclarations: params.tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: sanitizeSchemaForGemini(t.input_schema),
    })),
  }] : undefined

  const url = `https://generativelanguage.googleapis.com/v1/models/${spec.model}:generateContent?key=${apiKey}`
  const body: any = {
    contents,
    systemInstruction: { parts: [{ text: params.system }] },
    generationConfig: { maxOutputTokens: params.maxTokens ?? 8192, temperature: 0.7 },
  }
  if (tools) body.tools = tools

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
  const data = await res.json()

  const candidate = data.candidates?.[0]
  if (!candidate) throw new Error('Gemini: no candidates')
  const parts = candidate.content?.parts ?? []
  let text = ''
  const toolCalls: UnifiedResponse['tool_calls'] = []
  for (const part of parts) {
    if (part.text) text += part.text
    if (part.functionCall) {
      toolCalls.push({
        id: `call_${Math.random().toString(36).slice(2, 10)}`,
        name: part.functionCall.name,
        input: part.functionCall.args || {},
      })
    }
  }
  const stopReason: UnifiedResponse['stop_reason'] =
    toolCalls.length > 0 ? 'tool_use' : candidate.finishReason === 'MAX_TOKENS' ? 'max_tokens' : 'end_turn'

  return { text, tool_calls: toolCalls, stop_reason: stopReason, provider: spec.provider, model: spec.model }
}

function sanitizeSchemaForGemini(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema
  const cleaned: any = {}
  for (const [k, v] of Object.entries(schema)) {
    if (k === 'additionalProperties' || k === '$schema') continue
    if (k === 'type' && typeof v === 'string') cleaned[k] = v.toUpperCase()
    else if (Array.isArray(v)) cleaned[k] = v.map(sanitizeSchemaForGemini)
    else if (v && typeof v === 'object') cleaned[k] = sanitizeSchemaForGemini(v)
    else cleaned[k] = v
  }
  return cleaned
}

// -------------------- Groq --------------------

async function callGroq(
  spec: ProviderSpec,
  apiKey: string,
  params: { system: string; messages: UnifiedMessage[]; tools: UnifiedTool[]; maxTokens?: number }
): Promise<UnifiedResponse> {
  const messages: any[] = [{ role: 'system', content: params.system }]
  for (const m of params.messages) {
    if (m.role === 'assistant' && m.tool_calls?.length) {
      messages.push({
        role: 'assistant',
        content: m.content || null,
        tool_calls: m.tool_calls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: JSON.stringify(tc.input) },
        })),
      })
    } else if (m.role === 'tool') {
      messages.push({ role: 'tool', tool_call_id: m.tool_call_id, content: m.content })
    } else {
      messages.push({ role: m.role, content: m.content })
    }
  }

  const body: any = {
    model: spec.model,
    messages,
    max_tokens: params.maxTokens ?? 8192,
    temperature: 0.7,
  }
  if (params.tools.length) {
    body.tools = params.tools.map((t) => ({
      type: 'function',
      function: { name: t.name, description: t.description, parameters: t.input_schema },
    }))
    body.tool_choice = 'auto'
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`)
  const data = await res.json()

  const msg = data.choices?.[0]?.message
  if (!msg) throw new Error('Groq: no message')
  const text = msg.content || ''
  const toolCalls: UnifiedResponse['tool_calls'] = (msg.tool_calls || []).map((tc: any) => ({
    id: tc.id,
    name: tc.function.name,
    input: safeJsonParse(tc.function.arguments) || {},
  }))
  const stopReason: UnifiedResponse['stop_reason'] =
    toolCalls.length > 0 ? 'tool_use' : data.choices[0].finish_reason === 'length' ? 'max_tokens' : 'end_turn'

  return { text, tool_calls: toolCalls, stop_reason: stopReason, provider: spec.provider, model: spec.model }
}

function safeJsonParse(s: string): any {
  try { return JSON.parse(s) } catch { return s }
}
