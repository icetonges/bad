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
// POST — two modes depending on Content-Type:
//
//   A) multipart/form-data  (file ≤ 4MB)
//      → server reads binary, uploads to Blob, extracts text
//
//   B) application/json  (file > 4MB — text extracted by browser)
//      → body: { text, filename, mimeType, size, category }
//      → server stores a tiny marker blob, chunks + embeds the text
// ------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get('content-type') || ''
    const workspaceId = getWorkspaceId(req)

    // ---- Mode B: large file, text already extracted client-side ----
    if (ct.includes('application/json')) {
      const body = await req.json().catch(() => ({}))
      const { text, filename, mimeType, size, category } = body

      if (!text || !filename || !category)
        return NextResponse.json({ error: 'text, filename, and category required' }, { status: 400 })
      if (!['budget', 'audit', 'accounting', 'contracts'].includes(category))
        return NextResponse.json({ error: 'invalid category' }, { status: 400 })

      // Tiny marker blob so storage_url has a real value
      let storageUrl = `ref:${filename}`
      try {
        const marker = await put(
          `${workspaceId}/${category}/${Date.now()}-${filename}.ref`,
          `FedFMMatter reference: ${filename} (${size ?? '?'} bytes, client-extracted)`,
          { access: 'public', contentType: 'text/plain' }
        )
        storageUrl = marker.url
      } catch (e) {
        // Blob marker optional — continue even if it fails
        console.warn('Marker blob failed (non-fatal):', e)
      }

      const rows = await sql`
        insert into public.documents (workspace_id, category, filename, mime_type, size_bytes, storage_url)
        values (${workspaceId}::uuid, ${category}, ${filename}, ${mimeType ?? ''}, ${size ?? 0}, ${storageUrl})
        returning id, filename, size_bytes, created_at
      `
      const doc = rows[0]
      const chunkCount = await embedAndStore(text, doc.id)
      return NextResponse.json({ ok: true, document: doc, chunk_count: chunkCount })
    }

    // ---- Mode A: small file via FormData (≤ 4MB) ----
    const form = await req.formData()
    const file = form.get('file') as File | null
    const category = form.get('category') as string

    if (!file || !category)
      return NextResponse.json({ error: 'file and category required' }, { status: 400 })
    if (!['budget', 'audit', 'accounting', 'contracts'].includes(category))
      return NextResponse.json({ error: 'invalid category' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload binary to Blob
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

    // Save document record
    const rows = await sql`
      insert into public.documents (workspace_id, category, filename, mime_type, size_bytes, storage_url)
      values (${workspaceId}::uuid, ${category}, ${file.name}, ${file.type}, ${buffer.length}, ${storageUrl})
      returning id, filename, size_bytes, created_at
    `
    const doc = rows[0]

    // Extract text
    let text = ''
    try {
      text = await extractText(buffer, file.name, file.type)
    } catch (e) {
      return NextResponse.json({
        error: `Text extraction failed: ${String(e)}`,
        document: doc,
        chunk_count: 0,
      }, { status: 500 })
    }

    // Chunk + embed (catches embedding failures gracefully)
    let chunkCount = 0
    try {
      chunkCount = await embedAndStore(text, doc.id)
    } catch (e) {
      // Document saved but not embedded — surfaced as warning, not failure
      return NextResponse.json({
        ok: true,
        document: doc,
        chunk_count: 0,
        warning: `Document saved but embedding failed: ${String(e)}. Check that GOOGLE_API_KEY is set in Vercel env vars.`,
      })
    }

    return NextResponse.json({ ok: true, document: doc, chunk_count: chunkCount })

  } catch (err: any) {
    // Top-level catch — ensures we always return JSON even on unexpected crashes
    const msg = err?.message || String(err)
    let hint = ''
    if (/relation .* does not exist/i.test(msg))
      hint = ' — Database tables are missing. Run: npm run db:migrate'
    else if (/GOOGLE_API_KEY/i.test(msg) || /API_KEY/i.test(msg))
      hint = ' — GOOGLE_API_KEY is not set in Vercel environment variables.'
    else if (/DATABASE_URL/i.test(msg))
      hint = ' — DATABASE_URL is not set or invalid in Vercel environment variables.'
    return NextResponse.json({ error: msg + hint }, { status: 500 })
  }
}

// ------------------------------------------------------------------
// Chunk + embed, insert into public.chunks
// ------------------------------------------------------------------
async function embedAndStore(text: string, docId: string): Promise<number> {
  const chunks = chunkText(text)
  let count = 0
  const BATCH = 16
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH)
    const embeddings = await Promise.all(batch.map((c) => embedText(c)))
    for (let j = 0; j < batch.length; j++) {
      const embLit = `[${embeddings[j].join(',')}]`
      await sql`
        insert into public.chunks (document_id, chunk_index, content, embedding)
        values (${docId}::uuid, ${i + j}, ${batch[j]}, ${embLit}::vector)
      `
      count++
    }
  }
  return count
}

// ------------------------------------------------------------------
// Server-side text extraction (small files only)
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
// GET — list documents
// ------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const workspaceId = getWorkspaceId(req)
    const category = req.nextUrl.searchParams.get('category')

    const docs = category
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

    return NextResponse.json({ documents: docs })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
