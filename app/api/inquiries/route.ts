import { NextRequest, NextResponse } from 'next/server'
import { sql, getWorkspaceId } from '@/lib/db/neon'

export const runtime = 'nodejs'

// GET /api/inquiries              — list all sessions (paginated)
// GET /api/inquiries?id=uuid      — single session with full message thread
// GET /api/inquiries?category=x   — filter by category
// DELETE /api/inquiries?id=uuid   — delete session and all messages

export async function GET(req: NextRequest) {
  try {
    const workspaceId = getWorkspaceId(req)
    const id = req.nextUrl.searchParams.get('id')
    const category = req.nextUrl.searchParams.get('category')
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '50'), 100)

    // Single session — full thread
    if (id) {
      const sessions = await sql`
        select id, title, category, created_at, updated_at
        from public.chat_sessions
        where id = ${id}::uuid and workspace_id = ${workspaceId}::uuid
        limit 1
      `
      if (!sessions.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      const messages = await sql`
        select id, role, content, tool_calls, created_at
        from public.chat_messages
        where session_id = ${id}::uuid
        order by created_at asc
      `
      return NextResponse.json({ session: sessions[0], messages })
    }

    // List sessions
    const sessions = category
      ? await sql`
          select s.id, s.title, s.category, s.created_at, s.updated_at,
                 count(m.id)::int as message_count,
                 (select content from public.chat_messages
                  where session_id = s.id and role = 'user'
                  order by created_at asc limit 1) as first_question,
                 (select content from public.chat_messages
                  where session_id = s.id and role = 'assistant'
                  order by created_at desc limit 1) as last_response
          from public.chat_sessions s
          left join public.chat_messages m on m.session_id = s.id
          where s.workspace_id = ${workspaceId}::uuid and s.category = ${category}
          group by s.id
          order by s.updated_at desc
          limit ${limit}
        `
      : await sql`
          select s.id, s.title, s.category, s.created_at, s.updated_at,
                 count(m.id)::int as message_count,
                 (select content from public.chat_messages
                  where session_id = s.id and role = 'user'
                  order by created_at asc limit 1) as first_question,
                 (select content from public.chat_messages
                  where session_id = s.id and role = 'assistant'
                  order by created_at desc limit 1) as last_response
          from public.chat_sessions s
          left join public.chat_messages m on m.session_id = s.id
          where s.workspace_id = ${workspaceId}::uuid
          group by s.id
          order by s.updated_at desc
          limit ${limit}
        `

    return NextResponse.json({ sessions })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const workspaceId = getWorkspaceId(req)
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await sql`delete from public.chat_sessions where id = ${id}::uuid and workspace_id = ${workspaceId}::uuid`
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
