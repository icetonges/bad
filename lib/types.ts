export type Category = 'budget' | 'audit' | 'accounting' | 'contracts'

export interface Document {
  id: string
  user_id: string
  category: Category
  filename: string
  mime_type: string
  size_bytes: number
  storage_path: string
  created_at: string
  metadata: Record<string, unknown>
}

export interface Chunk {
  id: string
  document_id: string
  chunk_index: number
  content: string
  embedding?: number[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  session_id: string
  tool_calls?: ToolCall[]
}

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  output?: unknown
}

export interface Skill {
  id: string
  name: string
  category: Category | 'shared'
  description: string
  systemPrompt: string
  outputSchema?: Record<string, unknown>
  tools: string[]
}

export interface Report {
  id: string
  user_id: string
  skill_id: string
  category: Category
  title: string
  content: string
  artifacts: Record<string, unknown>
  created_at: string
}

export interface AgentContext {
  userId: string
  sessionId: string
  category?: Category
  documentIds?: string[]
}
