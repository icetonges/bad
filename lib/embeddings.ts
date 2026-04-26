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
  if (!res.ok) throw new Error(`Gemini embed ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const values = data?.embedding?.values
  if (!values || !Array.isArray(values)) throw new Error(`Unexpected embed response: ${JSON.stringify(data).slice(0, 200)}`)
  return values
}

export async function embedText(text: string): Promise<number[]> {
  return callEmbed(text, 'RETRIEVAL_DOCUMENT')
}

export async function embedQuery(text: string): Promise<number[]> {
  return callEmbed(text, 'RETRIEVAL_QUERY')
}

/**
 * Chunking strategy:
 * 1. Try paragraph-based (works well for prose-heavy documents)
 * 2. If document is sparse (few paragraphs), fall back to sliding-window character chunks
 *    This handles image-rendered PDFs where pdfjs extracts minimal/flat text.
 */
export function chunkText(text: string, chunkSize = 600, overlap = 120): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\t/g, ' ')

  // Paragraph-based split first
  const paragraphs = normalized.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 40)

  if (paragraphs.length >= 8) {
    // Enough structure — use paragraph chunking
    const chunks: string[] = []
    let buffer = ''
    for (const p of paragraphs) {
      if ((buffer + '\n\n' + p).length > chunkSize && buffer) {
        chunks.push(buffer.trim())
        // Carry overlap from the end of the last chunk
        buffer = buffer.slice(Math.max(0, buffer.length - overlap)) + '\n\n' + p
      } else {
        buffer = buffer ? buffer + '\n\n' + p : p
      }
    }
    if (buffer.trim()) chunks.push(buffer.trim())
    return chunks.filter(c => c.length > 50)
  }

  // Sparse document — sliding window on raw text
  // This produces useful chunks even when paragraphs are absent (image PDFs, flat CSVs)
  const flat = normalized.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
  if (flat.length < 100) return []

  const chunks: string[] = []
  const step = chunkSize - overlap
  for (let i = 0; i < flat.length; i += step) {
    const chunk = flat.slice(i, i + chunkSize).trim()
    if (chunk.length > 50) chunks.push(chunk)
    if (i + chunkSize >= flat.length) break
  }
  return chunks
}
