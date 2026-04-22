import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/db/supabase'
import { chunkText, embedText } from '@/lib/embeddings'
import pdfParse from 'pdf-parse'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const category = form.get('category') as string
  if (!file || !category) return NextResponse.json({ error: 'file and category required' }, { status: 400 })
  if (!['budget', 'audit', 'accounting', 'contracts'].includes(category))
    return NextResponse.json({ error: 'invalid category' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const admin = createAdminSupabase()

  const storagePath = `${user.id}/${category}/${Date.now()}-${file.name}`
  const { error: upErr } = await admin.storage.from('documents').upload(storagePath, buffer, {
    contentType: file.type,
    upsert: false,
  })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data: doc, error: dErr } = await admin
    .from('documents')
    .insert({
      user_id: user.id,
      category,
      filename: file.name,
      mime_type: file.type,
      size_bytes: buffer.length,
      storage_path: storagePath,
    })
    .select()
    .single()
  if (dErr || !doc) return NextResponse.json({ error: dErr?.message }, { status: 500 })

  const text = await extractText(buffer, file.name, file.type)
  const chunks = chunkText(text)

  const rows: Array<{ document_id: string; chunk_index: number; content: string; embedding: number[] }> = []
  const BATCH = 16
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH)
    const embeddings = await Promise.all(batch.map((c) => embedText(c)))
    batch.forEach((content, j) => {
      rows.push({ document_id: doc.id, chunk_index: i + j, content, embedding: embeddings[j] })
    })
  }
  if (rows.length) {
    const { error: cErr } = await admin.from('chunks').insert(rows)
    if (cErr) return NextResponse.json({ error: cErr.message, document_id: doc.id }, { status: 500 })
  }

  return NextResponse.json({ ok: true, document: doc, chunk_count: rows.length })
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
      const sheet = wb.Sheets[name]
      parts.push(`## Sheet: ${name}\n` + XLSX.utils.sheet_to_csv(sheet))
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
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const category = req.nextUrl.searchParams.get('category')
  const admin = createAdminSupabase()
  let q = admin.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  if (category) q = q.eq('category', category)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ documents: data })
}
