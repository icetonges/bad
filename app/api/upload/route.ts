import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { sql, getWorkspaceId } from '@/lib/db/neon'
import { chunkText, embedText } from '@/lib/embeddings'
import pdfParse from 'pdf-parse'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  const category = form.get('category') as string
  if (!file || !category) return NextResponse.json({ error: 'file and category required' }, { status: 400 })
  if (!['budget', 'audit', 'accounting', 'contracts'].includes(category))
    return NextResponse.json({ error: 'invalid category' }, { status: 400 })

  const workspaceId = getWorkspaceId(req)
  const buffer = Buffer.from(await file.arrayBuffer())

  let storageUrl = ''
  try {
    const blob = await put(`${workspaceId}/${category}/${Date.now()}-${file.name}`, buffer, {
      access: 'public',
      contentType: file.type,
    })
    storageUrl = blob.url
  } catch (e) {
    return NextResponse.json({ error: `Blob upload failed: ${String(e)}` }, { status: 500 })
  }

  const rows = await sql`
    insert into public.documents (workspace_id, category, filename, mime_type, size_bytes, storage_url)
    values (${workspaceId}::uuid, ${category}, ${file.name}, ${file.type}, ${buffer.length}, ${storageUrl})
    returning id, filename, size_bytes, created_at
  `
  const doc = rows[0]

  let text = ''
  try {
    text = await extractText(buffer, file.name, file.type)
  } catch (e) {
    return NextResponse.json({ error: `Parse failed: ${String(e)}`, document: doc }, { status: 500 })
  }

  const chunks = chunkText(text)
  let chunkCount = 0
  const BATCH = 16
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH)
    const embeddings = await Promise.all(batch.map((c) => embedText(c)))
    for (let j = 0; j < batch.length; j++) {
      const idx = i + j
      const embLit = `[${embeddings[j].join(',')}]`
      await sql`
        insert into public.chunks (document_id, chunk_index, content, embedding)
        values (${doc.id}::uuid, ${idx}, ${batch[j]}, ${embLit}::vector)
      `
      chunkCount++
    }
  }

  return NextResponse.json({ ok: true, document: doc, chunk_count: chunkCount })
}

async function extractText(buffer: Buffer, filename: string, mime: string): Promise<string> {
  const lower = filename.toLowerCase()
  if (mime === 'application/pdf' || lower.endsWith('.pdf')) {
    const parsed = await pdfParse(buffer)
    return parsed.text
  }
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || mime.includes('spreadsheet')) {
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const parts: string[] = []
    for (const name of wb.SheetNames) {
      parts.push(`## Sheet: ${name}\n` + XLSX.utils.sheet_to_csv(wb.Sheets[name]))
    }
    return parts.join('\n\n')
  }
  if (lower.endsWith('.csv') || mime === 'text/csv') {
    const text = buffer.toString('utf-8')
    const parsed = Papa.parse(text, { header: true })
    return JSON.stringify(parsed.data, null, 2)
  }
  return buffer.toString('utf-8')
}

export async function GET(req: NextRequest) {
  const workspaceId = getWorkspaceId(req)
  const category = req.nextUrl.searchParams.get('category')

  const documents = category
    ? await sql`
        select id, category, filename, size_bytes, storage_url, created_at
        from public.documents
        where workspace_id = ${workspaceId}::uuid and category = ${category}
        order by created_at desc
      `
    : await sql`
        select id, category, filename, size_bytes, storage_url, created_at
        from public.documents
        where workspace_id = ${workspaceId}::uuid
        order by created_at desc
      `

  return NextResponse.json({ documents })
}
