import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { sql, getWorkspaceId, DEFAULT_WORKSPACE_ID } from '@/lib/db/neon'
import { chunkText, embedText } from '@/lib/embeddings'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/ingest
 *
 * Called by GitHub Action to ingest DoD obligation data from USASpending.gov.
 * Protected by INGEST_SECRET env var (Bearer token).
 *
 * Body:
 *   {
 *     source: 'usaspending' | 'treasury' | 'custom',
 *     dataset: 'dod_obligations' | 'dod_accounts' | 'dod_awards',
 *     period: '2025-Q3',          // fiscal period label
 *     filename: 'dod_obligations_2025_Q3.json',
 *     content: string,            // pre-formatted text content to embed
 *     metadata: { ... },          // any extra metadata
 *     workspace_id?: string,      // optional workspace override
 *   }
 */
export async function POST(req: NextRequest) {
  // Auth check — must match INGEST_SECRET env var
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.INGEST_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { source, dataset, period, filename, content, metadata } = body

    if (!filename || !content)
      return NextResponse.json({ error: 'filename and content required' }, { status: 400 })

    const workspaceId = body.workspace_id || DEFAULT_WORKSPACE_ID
    const category = 'accounting'

    // Each period gets its own document — never overwrite across periods
    // Only update if same filename (same period re-run)
    const existing = await sql`
      select id from public.documents
      where workspace_id = ${workspaceId}::uuid
        and filename = ${filename}
        and category = ${category}
      limit 1
    `

    const fullMeta = JSON.stringify({
      source, dataset, period,
      auto_ingested: true,
      pulled_at: new Date().toISOString(),
      ...(metadata ?? {}),
    })

    let docId: string

    if (existing.length > 0) {
      docId = (existing[0] as any).id
      await sql`delete from public.chunks where document_id = ${docId}::uuid`
      await sql`
        update public.documents set
          metadata = ${fullMeta}::jsonb,
          created_at = now()
        where id = ${docId}::uuid
      `
    } else {
      // Store a marker blob
      let storageUrl = `ingest:${filename}`
      try {
        const blob = await put(
          `ingest/${DEFAULT_WORKSPACE_ID}/${filename}`,
          content.slice(0, 5000), // Store preview only — full content is in chunks
          { access: 'public', contentType: 'text/plain' }
        )
        storageUrl = blob.url
      } catch {}

      const rows = await sql`
        insert into public.documents (workspace_id, category, filename, mime_type, size_bytes, storage_url, metadata)
        values (
          ${workspaceId}::uuid, ${category}, ${filename}, 'text/plain',
          ${Buffer.byteLength(content, 'utf8')}, ${storageUrl},
          ${fullMeta}::jsonb
        )
        returning id
      `
      docId = (rows[0] as any).id
    }

    // Chunk and embed
    const chunks = chunkText(content, 800, 150)
    let chunkCount = 0
    const BATCH = 8

    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH)
      const embeddings = await Promise.all(batch.map(c => embedText(c)))
      for (let j = 0; j < batch.length; j++) {
        const embLit = `[${embeddings[j].join(',')}]`
        await sql`
          insert into public.chunks (document_id, chunk_index, content, embedding)
          values (${docId}::uuid, ${i + j}, ${batch[j]}, ${embLit}::vector)
        `
        chunkCount++
      }
    }

    return NextResponse.json({
      ok: true,
      doc_id: docId,
      filename,
      period,
      chunk_count: chunkCount,
      action: existing.length > 0 ? 'updated' : 'created',
    })

  } catch (err: any) {
    console.error('Ingest error:', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

/**
 * GET /api/ingest — list ingested datasets
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.INGEST_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await sql`
    select d.id, d.filename, d.category, d.size_bytes, d.created_at, d.metadata,
           count(c.id)::int as chunk_count
    from public.documents d
    left join public.chunks c on c.document_id = d.id
    where d.metadata->>'auto_ingested' = 'true'
    group by d.id
    order by d.created_at desc
    limit 50
  `
  return NextResponse.json({ datasets: rows })
}
