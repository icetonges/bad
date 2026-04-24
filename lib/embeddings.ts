/**
 * Gemini text-embedding-004 — 768 dimensions, free tier generous.
 * https://ai.google.dev/gemini-api/docs/embeddings
 */

const GEMINI_EMBED_URL = 'https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent'

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) throw new Error('GOOGLE_API_KEY not set (required for embeddings)')

  const clean = text.replace(/\s+/g, ' ').trim().slice(0, 30000)

  const res = await fetch(`${GEMINI_EMBED_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/text-embedding-004',
      content: { parts: [{ text: clean }] },
      taskType: 'RETRIEVAL_DOCUMENT',
    }),
  })
  if (!res.ok) throw new Error(`Gemini embed ${res.status}: ${await res.text()}`)
  const data = await res.json()
  if (!data.embedding?.values) throw new Error('Gemini embed: missing values')
  return data.embedding.values
}

export async function embedQuery(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) throw new Error('GOOGLE_API_KEY not set')
  const clean = text.replace(/\s+/g, ' ').trim().slice(0, 30000)
  const res = await fetch(`${GEMINI_EMBED_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/text-embedding-004',
      content: { parts: [{ text: clean }] },
      taskType: 'RETRIEVAL_QUERY',
    }),
  })
  if (!res.ok) throw new Error(`Gemini embed ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.embedding.values
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
