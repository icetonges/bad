const VOYAGE_API = 'https://api.voyageai.com/v1/embeddings'
const OPENAI_API = 'https://api.openai.com/v1/embeddings'

export async function embedText(text: string): Promise<number[]> {
  const clean = text.replace(/\s+/g, ' ').trim().slice(0, 30000)
  if (process.env.VOYAGE_API_KEY) {
    const res = await fetch(VOYAGE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        input: [clean],
        model: process.env.EMBEDDING_MODEL || 'voyage-3-large',
        input_type: 'document',
        output_dimension: 1024,
      }),
    })
    const data = await res.json()
    if (!data.data?.[0]?.embedding) throw new Error('Voyage embed failed: ' + JSON.stringify(data))
    return data.data[0].embedding
  }
  if (process.env.OPENAI_API_KEY) {
    const res = await fetch(OPENAI_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: clean,
        model: process.env.EMBEDDING_MODEL || 'text-embedding-3-large',
        dimensions: 1024,
      }),
    })
    const data = await res.json()
    if (!data.data?.[0]?.embedding) throw new Error('OpenAI embed failed: ' + JSON.stringify(data))
    return data.data[0].embedding
  }
  throw new Error('No embedding provider configured. Set VOYAGE_API_KEY or OPENAI_API_KEY.')
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
