import { NextRequest } from 'next/server'
import { runAgent, type AgentEvent } from '@/lib/agent/agent'
import { sql, getWorkspaceId } from '@/lib/db/neon'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { message, sessionId, category } = body
  if (!message) return new Response(JSON.stringify({ error: 'message required' }), { status: 400 })

  const workspaceId = getWorkspaceId(req)

  let sid = sessionId
  try {
    if (!sid) {
      const rows = await sql`
        insert into public.chat_sessions (workspace_id, category, title)
        values (${workspaceId}::uuid, ${category ?? null}, ${String(message).slice(0, 80)})
        returning id
      `
      sid = rows[0].id
    }
    await sql`
      insert into public.chat_messages (session_id, role, content)
      values (${sid}::uuid, 'user', ${message})
    `
  } catch (e: any) {
    // DB errors surfaced as an error event — still stream so the UI shows something
    const stream = errorStream(`Database error: ${e?.message}. Check that tables exist (run db:migrate) and DATABASE_URL is set in Vercel.`)
    return sseResponse(stream)
  }

  const history = await sql`
    select role, content from public.chat_messages
    where session_id = ${sid}::uuid
    order by created_at asc limit 20
  `.catch(() => [])

  const previousMessages = history
    .slice(0, -1)
    .filter((m: any) => m.role === 'user' || m.role === 'assistant')
    .map((m: any) => ({ role: m.role, content: m.content }))

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (obj: Record<string, unknown>) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`))

      try {
        const result = await runAgent(
          message,
          { userId: workspaceId, sessionId: sid, category },
          previousMessages,
          (evt: AgentEvent) => send(evt as unknown as Record<string, unknown>)
        )

        // Persist assistant message
        await sql`
          insert into public.chat_messages (session_id, role, content, tool_calls)
          values (${sid}::uuid, 'assistant', ${result.text}, ${JSON.stringify(result.toolCalls)}::jsonb)
        `.catch(() => {})

        await sql`update public.chat_sessions set updated_at = now() where id = ${sid}::uuid`.catch(() => {})

        send({ type: 'done', sessionId: sid })
      } catch (err: any) {
        send({ type: 'error', message: err?.message || String(err) })
        send({ type: 'done', sessionId: sid })
      } finally {
        controller.close()
      }
    },
  })

  return sseResponse(stream)
}

function sseResponse(stream: ReadableStream) {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}

function errorStream(message: string) {
  return new ReadableStream({
    start(controller) {
      const enc = new TextEncoder()
      controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`))
      controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
      controller.close()
    },
  })
}
