export type UnifiedRole = 'system' | 'user' | 'assistant' | 'tool'

export interface UnifiedMessage {
  role: UnifiedRole
  content: string
  tool_calls?: Array<{ id: string; name: string; input: Record<string, unknown> }>
  tool_call_id?: string
  tool_name?: string  // actual function name, required for Gemini functionResponse
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
  provider: 'google' | 'groq'
  model: string
  envKey: string
}

// Current stable models as of April 2026
export const MODEL_WATERFALL: ProviderSpec[] = [
  { id: 'gemini-2.5-flash',      provider: 'google', model: 'gemini-2.5-flash',           envKey: 'GOOGLE_API_KEY' },
  { id: 'gemini-2.5-flash-lite', provider: 'google', model: 'gemini-2.5-flash-lite',       envKey: 'GOOGLE_API_KEY' },
  { id: 'llama-70b',             provider: 'groq',   model: 'llama-3.3-70b-versatile',     envKey: 'GROQ_API_KEY' },
  { id: 'llama-8b',              provider: 'groq',   model: 'llama-3.1-8b-instant',        envKey: 'GROQ_API_KEY' },
]

export async function generateWithTools(params: {
  system: string
  messages: UnifiedMessage[]
  tools: UnifiedTool[]
  maxTokens?: number
  onProviderChange?: (spec: ProviderSpec) => void
}): Promise<UnifiedResponse> {
  const errors: string[] = []
  for (const spec of MODEL_WATERFALL) {
    const apiKey = process.env[spec.envKey]
    if (!apiKey) { errors.push(`[${spec.id}] ${spec.envKey} not set`); continue }
    params.onProviderChange?.(spec)
    try {
      return spec.provider === 'google'
        ? await callGemini(spec, apiKey, params)
        : await callGroq(spec, apiKey, params)
    } catch (e: any) {
      errors.push(`[${spec.id}] ${e?.message || e}`)
    }
  }
  throw new Error('All providers failed:\n' + errors.join('\n'))
}

async function callGemini(spec: ProviderSpec, apiKey: string, params: {
  system: string; messages: UnifiedMessage[]; tools: UnifiedTool[]; maxTokens?: number
}): Promise<UnifiedResponse> {
  const contents: any[] = []
  for (const m of params.messages) {
    if (m.role === 'system') continue
    if (m.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: m.content || ' ' }] })
    } else if (m.role === 'assistant') {
      const parts: any[] = []
      if (m.content) parts.push({ text: m.content })
      for (const tc of m.tool_calls ?? [])
        parts.push({ functionCall: { name: tc.name, args: tc.input } })
      if (parts.length) contents.push({ role: 'model', parts })
    } else if (m.role === 'tool') {
      const parsed = tryParse(m.content)
      contents.push({
        role: 'user',
        parts: [{ functionResponse: {
          name: m.tool_name || 'tool',
          response: typeof parsed === 'object' && parsed !== null ? parsed : { result: parsed },
        }}],
      })
    }
  }

  const body: any = {
    contents,
    systemInstruction: { parts: [{ text: params.system }] },
    generationConfig: { maxOutputTokens: params.maxTokens ?? 2048, temperature: 0.7 },
  }
  if (params.tools.length) {
    body.tools = [{ functionDeclarations: params.tools.map(t => ({
      name: t.name,
      description: t.description,
      parameters: geminiSchema(t.input_schema),
    })) }]
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${spec.model}:generateContent?key=${apiKey}`
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const parts = data.candidates?.[0]?.content?.parts ?? []
  let text = ''
  const toolCalls: UnifiedResponse['tool_calls'] = []
  for (const p of parts) {
    if (p.text) text += p.text
    if (p.functionCall) toolCalls.push({ id: `c_${Math.random().toString(36).slice(2,9)}`, name: p.functionCall.name, input: p.functionCall.args ?? {} })
  }
  return { text, tool_calls: toolCalls, stop_reason: toolCalls.length ? 'tool_use' : 'end_turn', provider: spec.provider, model: spec.model }
}

async function callGroq(spec: ProviderSpec, apiKey: string, params: {
  system: string; messages: UnifiedMessage[]; tools: UnifiedTool[]; maxTokens?: number
}): Promise<UnifiedResponse> {
  const messages: any[] = [{ role: 'system', content: params.system }]
  for (const m of params.messages) {
    if (m.role === 'assistant' && m.tool_calls?.length) {
      messages.push({ role: 'assistant', content: m.content || null,
        tool_calls: m.tool_calls.map(tc => ({ id: tc.id, type: 'function', function: { name: tc.name, arguments: JSON.stringify(tc.input) } })) })
    } else if (m.role === 'tool') {
      messages.push({ role: 'tool', tool_call_id: m.tool_call_id, content: m.content })
    } else if (m.role !== 'system') {
      messages.push({ role: m.role, content: m.content })
    }
  }
  const body: any = { model: spec.model, messages, max_tokens: params.maxTokens ?? 2048, temperature: 0.7 }
  if (params.tools.length) {
    body.tools = params.tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.input_schema } }))
    body.tool_choice = 'auto'
  }
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const msg = data.choices?.[0]?.message
  const text = msg?.content || ''
  const toolCalls = (msg?.tool_calls ?? []).map((tc: any) => ({
    id: tc.id, name: tc.function.name, input: tryParse(tc.function.arguments) ?? {}
  }))
  return { text, tool_calls: toolCalls, stop_reason: toolCalls.length ? 'tool_use' : 'end_turn', provider: spec.provider, model: spec.model }
}

function geminiSchema(s: any): any {
  if (!s || typeof s !== 'object') return s
  const out: any = {}
  for (const [k, v] of Object.entries(s)) {
    if (k === 'additionalProperties' || k === '$schema') continue
    if (k === 'type' && typeof v === 'string') out[k] = v.toUpperCase()
    else if (Array.isArray(v)) out[k] = v.map(geminiSchema)
    else if (v && typeof v === 'object') out[k] = geminiSchema(v)
    else out[k] = v
  }
  return out
}

function tryParse(s: string): any {
  try { return JSON.parse(s) } catch { return s }
}
