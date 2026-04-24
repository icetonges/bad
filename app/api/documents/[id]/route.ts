import { NextRequest, NextResponse } from 'next/server'
import { sql, getWorkspaceId } from '@/lib/db/neon'
import { del } from '@vercel/blob'
import { chunkText, embedText } from '@/lib/embeddings'
import pdfParse from 'pdf-parse'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export const runtime = 'nodejs'
export const maxDuration = 60

// DELETE /api/documents/[id] — remove document and all chunks
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workspaceId = getWorkspaceId(req)
    const { id } = params

    // Verify ownership before deleting
    const rows = await sql`
      select id, storage_url from public.documents
      where id = ${id}::uuid and workspace_id = ${workspaceId}::uuid
      limit 1
    `
    if (!rows.length)
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const doc = rows[0]

    // Delete chunks first (FK cascade would handle this too, but being explicit)
    await sql`delete from public.chunks where document_id = ${id}::uuid`

    // Delete document record
    await sql`delete from public.documents where id = ${id}::uuid`

    // Attempt to delete from Vercel Blob (non-fatal if it fails)
    if (doc.storage_url && doc.storage_url.startsWith('https://')) {
      try { await del(doc.storage_url) } catch {}
    }

    return NextResponse.json({ ok: true, deleted: id })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

// POST /api/documents/[id]/embed — re-fetch from Blob and re-embed
// This fixes documents that uploaded successfully but have 0 chunks
// (typically because GOOGLE_API_KEY wasn't set at upload time)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workspaceId = getWorkspaceId(req)
    const { id } = params

    const rows = await sql`
      select id, filename, mime_type, storage_url from public.documents
      where id = ${id}::uuid and workspace_id = ${workspaceId}::uuid
      limit 1
    `
    if (!rows.length)
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const doc = rows[0]

    // Only re-embed actual blob URLs (not ref: markers)
    if (!doc.storage_url || !doc.storage_url.startsWith('https://')) {
      return NextResponse.json({
        error: 'This document was uploaded when its content was extracted in the browser. To re-embed it, delete and re-upload the file.',
        doc_id: id,
      }, { status: 400 })
    }

    // Fetch the file from Vercel Blob
    let buffer: Buffer
    try {
      const res = await fetch(doc.storage_url)
      if (!res.ok) throw new Error(`Blob fetch returned ${res.status}`)
      buffer = Buffer.from(await res.arrayBuffer())
    } catch (e) {
      return NextResponse.json({ error: `Could not fetch file from storage: ${String(e)}` }, { status: 500 })
    }

    // Extract text
    let text = ''
    try {
      text = await extractText(buffer, doc.filename, doc.mime_type)
    } catch (e) {
      return NextResponse.json({ error: `Text extraction failed: ${String(e)}` }, { status: 500 })
    }

    // Delete old chunks before re-embedding
    await sql`delete from public.chunks where document_id = ${id}::uuid`

    // Re-embed
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
          values (${id}::uuid, ${i + j}, ${batch[j]}, ${embLit}::vector)
        `
        chunkCount++
      }
    }

    return NextResponse.json({ ok: true, doc_id: id, chunk_count: chunkCount })
  } catch (err: any) {
    const msg = err?.message || String(err)
    let hint = ''
    if (/GOOGLE_API_KEY/i.test(msg))
      hint = ' — Add GOOGLE_API_KEY to Vercel environment variables, then redeploy.'
    return NextResponse.json({ error: msg + hint }, { status: 500 })
  }
}

async function extractText(buffer: Buffer, filename: string, mime: string): Promise<string> {
  const lower = filename.toLowerCase()
  if (mime === 'application/pdf' || lower.endsWith('.pdf')) {
    const parsed = await pdfParse(buffer)
    return parsed.text
  }
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || mime.includes('spreadsheet')) {
    const wb = XLSX.read(buffer, { type: 'buffer' })
    return wb.SheetNames.map(
      (n) => `## Sheet: ${n}\n` + XLSX.utils.sheet_to_csv(wb.Sheets[n])
    ).join('\n\n')
  }
  if (lower.endsWith('.csv') || mime === 'text/csv') {
    return JSON.stringify(Papa.parse(buffer.toString('utf-8'), { header: true }).data, null, 2)
  }
  return buffer.toString('utf-8')
}
