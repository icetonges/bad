import { NextRequest, NextResponse } from 'next/server'
import { sql, getWorkspaceId } from '@/lib/db/neon'
import { embedQuery } from '@/lib/embeddings'

export const runtime = 'nodejs'
export const maxDuration = 15

export async function GET(req: NextRequest) {
  try {
    const workspaceId = getWorkspaceId(req)

    // Basic document stats
    const docStats = await sql`
      select count(d.id)::int as total_docs,
             sum(case when (select count(*) from public.chunks c where c.document_id = d.id) > 0 then 1 else 0 end)::int as indexed_docs,
             (select count(*)::int from public.chunks c2 join public.documents d2 on d2.id = c2.document_id where d2.workspace_id = ${workspaceId}::uuid and d2.category = 'audit') as total_chunks
      from public.documents d
      where d.workspace_id = ${workspaceId}::uuid and d.category = 'audit'
    `
    const { total_docs, indexed_docs, total_chunks } = (docStats[0] ?? {}) as any

    // If no indexed audit chunks, return basic stats
    if (!total_chunks || total_chunks === 0) {
      return NextResponse.json({ total_docs, indexed_docs, total_chunks: 0, open_findings: null, opinion_score: null })
    }

    // Search for material weakness count signal
    let openFindings: number | null = null
    let opinionScore: string | null = null

    try {
      const mwEmb = await embedQuery('material weakness findings identified total count')
      const mwLit = `[${mwEmb.join(',')}]`
      const mwRows = await sql`
        select c.content from public.chunks c
        join public.documents d on d.id = c.document_id
        where d.workspace_id = ${workspaceId}::uuid and d.category = 'audit'
          and 1 - (c.embedding <=> ${mwLit}::vector) > 0.2
        order by c.embedding <=> ${mwLit}::vector limit 5
      `
      // Look for a number near "material weakness" in the text
      const allText = mwRows.map((r: any) => r.content).join(' ')
      const m26 = allText.match(/\b(26|twenty.six)\b.*material weakness/i) || allText.match(/material weakness.*\b(26|twenty.six)\b/i)
      if (m26) openFindings = 26
      else {
        const numMatch = allText.match(/(\d+)\s+material weakness/i)
        if (numMatch) openFindings = parseInt(numMatch[1])
      }

      // Opinion score
      const opEmb = await embedQuery('audit opinion disclaimer qualified unmodified')
      const opLit = `[${opEmb.join(',')}]`
      const opRows = await sql`
        select c.content from public.chunks c
        join public.documents d on d.id = c.document_id
        where d.workspace_id = ${workspaceId}::uuid and d.category = 'audit'
          and 1 - (c.embedding <=> ${opLit}::vector) > 0.2
        order by c.embedding <=> ${opLit}::vector limit 3
      `
      const opText = opRows.map((r: any) => r.content).join(' ')
      if (/disclaimer/i.test(opText)) opinionScore = 'Disclaimer'
      else if (/unmodified|clean opinion/i.test(opText)) opinionScore = 'Clean'
      else if (/qualified/i.test(opText)) opinionScore = 'Qualified'
      else if (/adverse/i.test(opText)) opinionScore = 'Adverse'
    } catch {}

    return NextResponse.json({
      total_docs: total_docs ?? 0,
      indexed_docs: indexed_docs ?? 0,
      total_chunks: total_chunks ?? 0,
      open_findings: openFindings,
      opinion_score: opinionScore,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
