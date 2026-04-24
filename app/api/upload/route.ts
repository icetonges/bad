import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { sql, getWorkspaceId } from '@/lib/db/neon'
import { chunkText, embedText } from '@/lib/embeddings'
import pdfParse from 'pdf-parse'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export const runtime = 'nodejs'
export const maxDuration = 60

// ------------------------------------------------------------------
// POST — two modes:
//
//   Mode A (small files ≤4MB): multipart/form-data with `file` field
//     → uploads to Vercel Blob, extracts text, chunks, embeds, saves to DB
//
//   Mode B (large files): JSON body with `blobUrl` field
//     → file already uploaded to Vercel Blob by the client
//     → just fetch the text, chunk, embed, save to DB
// ------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || ''
  const workspaceId = getWorkspaceId(req)

  // Mode B — client already uploaded to Blob, we just process the URL
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}))
    const { blobUrl, filename, mimeType, size, category } = body
    if (!blobUrl || !filename || !category)
      return NextResponse.json({ error: 'blobUrl, filename, and category required' }, { status: 400 })

    return processBlob({ blobUrl, filename, mimeType, size, category, workspaceId })
  }

  // Mode A — small file via formData
  const form = await req.formData()
  const file = form.get('file') as File | null
  const category = form.get('category') as string
  if (!file || !category)
    return NextResponse.json({ error: 'file and category required' }, { status: 400 })
  if (!['budget', 'audit', 'accounting', 'contracts'].includes(category))
    return NextResponse.json({ error: 'invalid category' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())

  let storageUrl = ''
  try {
    const blob = await put(
      `${workspaceId}/${category}/${Date.now()}-${file.name}`,
      buffer,
      { access: 'public', contentType: file.type }
    )
    storageUrl = blob.url
  } catch (e) {
    return NextResponse.json({ error: `Blob upload failed: ${String(e)}` }, { status: 500 })
  }

  return processBlob({
    blobUrl: storageUrl,
    filename: file.name,
    mimeType: file.type,
    size: buffer.length,
    category,
    workspaceId,
    buffer, // skip re-fetching when we already have the buffer
  })
}

// ------------------------------------------------------------------
// Core: save document record, extract text, chunk, embed
// ------------------------------------------------------------------
async function processBlob(params: {
  blobUrl: string
  filename: string
  mimeType: string
  size: number
  category: string
  workspaceId: string
  buffer?: Buffer
}) {
  const { blobUrl, filename, mimeType, size, category, workspaceId } = params
  let buffer = params.buffer

  // If no buffer yet (Mode B — large file already in Blob), fetch it
  if (!buffer) {
    try {
      const res = await fetch(blobUrl)
      if (!res.ok) throw new Error(`Failed to fetch blob: ${res.status}`)
      buffer = Buffer.from(await res.arrayBuffer())
    } catch (e) {
      return NextResponse.json({ error: `Could not fetch uploaded file: ${String(e)}` }, { status: 500 })
    }
  }

  // Save document record
  const rows = await sql`
    insert into public.documents (workspace_id, category, filename, mime_type, size_bytes, storage_url)
    values (${workspaceId}::uuid, ${category}, ${filename}, ${mimeType ?? ''}, ${size ?? buffer.length}, ${blobUrl})
    returning id, filename, size_bytes, created_at
  `
  const doc = rows[0]

  // Extract text
  let text = ''
  try {
    text = await extractText(buffer, filename, mimeType ?? '')
  } catch (e) {
    return NextResponse.json({ error: `Text extraction failed: ${String(e)}`, document: doc }, { status: 500 })
  }

  // Chunk and embed
  const chunks = chunkText(text)
  let chunkCount = 0
  const BATCH = 16
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH)
    const embeddings = await Promise.all(batch.map((c) => embedText(c)))
    for (let j = 0; j < batch.length; j++) {
      const embLit = `[${embeddings[j].join(',')}]`
      await sql`
        insert into public.chunks (document_id, chunk_index, content, embedding)
        values (${doc.id}::uuid, ${i + j}, ${batch[j]}, ${embLit}::vector)
      `
      chunkCount++
    }
  }

  return NextResponse.json({ ok: true, document: doc, chunk_count: chunkCount })
}

// ------------------------------------------------------------------
// Text extraction by file type
// ------------------------------------------------------------------
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
    const parsed = Papa.parse(buffer.toString('utf-8'), { header: true })
    return JSON.stringify(parsed.data, null, 2)
  }
  return buffer.toString('utf-8')
}

// ------------------------------------------------------------------
// GET — list documents for a workspace/category
// ------------------------------------------------------------------
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
