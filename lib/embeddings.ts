/**
 * Gemini gemini-embedding-001
 *
 * text-embedding-004 was deprecated and returns 404 as of early 2025.
 * Replacement: gemini-embedding-001 (default 3072 dims, supports MRL truncation).
 * We request outputDimensionality: 768 to match the existing vector(768) column schema.
 *
 * API: v1beta (gemini-embedding-001 lives here, not v1)
 * Docs: https://ai.google.dev/gemini-api/docs/embeddings
 */

const EMBED_MODEL = 'gemini-embedding-001'
const EMBED_DIM = 768
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

async function callEmbed(text: string, taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY'): Promise<number[]> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) throw new Error('GOOGLE_API_KEY not set')

  const clean = text.replace(/\s+/g, ' ').trim().slice(0, 30000)

  const res = await fetch(`${BASE_URL}/${EMBED_MODEL}:embedContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text: clean }] },
      taskType,
      outputDimensionality: EMBED_DIM,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini embed ${res.status}: ${err}`)
  }

  const data = await res.json()
  const values = data?.embedding?.values
  if (!values || !Array.isArray(values)) {
    throw new Error(`Gemini embed: unexpected response shape: ${JSON.stringify(data).slice(0, 200)}`)
  }
  return values
}

export async function embedText(text: string): Promise<number[]> {
  return callEmbed(text, 'RETRIEVAL_DOCUMENT')
}

export async function embedQuery(text: string): Promise<number[]> {
  return callEmbed(text, 'RETRIEVAL_QUERY')
}

export function chunkText(text: string, chunkSize = 1200, overlap = 150): string[] {
  const paragraphs = text.split(/\n\s*\n/)
  const chunks: string[] = []
  let buffer = ''
  for (const p of paragraphs) {
    if ((buffer + '\n\n' + p).length > chunkSize) {
      if (buffer) chunks.push(buffer.trim())
      buffer = buffer.slice(Math.max(0, buffer.length - overlap)) + '\n\n' + p
    } else {
      buffer += (buffer ? '\n\n' : '') + p
    }
  }
  if (buffer) chunks.push(buffer.trim())
  return chunks.filter((c) => c.length > 50)
}
