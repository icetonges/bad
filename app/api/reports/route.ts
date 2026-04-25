import { NextRequest, NextResponse } from 'next/server'
import { sql, getWorkspaceId } from '@/lib/db/neon'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const workspaceId = getWorkspaceId(req)
  const category = req.nextUrl.searchParams.get('category')
  const id = req.nextUrl.searchParams.get('id')

  if (id) {
    const rows = await sql`
      select * from public.reports
      where id = ${id}::uuid and workspace_id = ${workspaceId}::uuid
      limit 1
    `
    if (!rows.length) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ report: rows[0] })
  }

  const reports = category
    ? await sql`
        select id, title, category, skill_id, created_at
        from public.reports
        where workspace_id = ${workspaceId}::uuid and category = ${category}
        order by created_at desc
      `
    : await sql`
        select id, title, category, skill_id, created_at
        from public.reports
        where workspace_id = ${workspaceId}::uuid
        order by created_at desc
      `

  return NextResponse.json({ reports })
}

export async function DELETE(req: NextRequest) {
  try {
    const workspaceId = getWorkspaceId(req)
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await sql`delete from public.reports where id = ${id}::uuid and workspace_id = ${workspaceId}::uuid`
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
