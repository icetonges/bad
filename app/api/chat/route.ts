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
  if (!sid) {
    const title = String(message).slice(0, 80)
    const rows = await sql`
      insert into public.chat_sessions (workspace_id, category, title)
      values (${workspaceId}::uuid, ${category ?? null}, ${title})
      returning id
    `
    sid = rows[0].id
  }

  await sql`
    insert into public.chat_messages (session_id, role, content)
    values (${sid}::uuid, 'user', ${message})
  `

  const history = await sql`
    select role, content from public.chat_messages
    where session_id = ${sid}::uuid
    order by created_at asc
    limit 40
  `
  const previousMessages = history
    .slice(0, -1)
    .filter((m: any) => m.role === 'user' || m.role === 'assistant')
    .map((m: any) => ({ role: m.role, content: m.content }))

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (evt: AgentEvent | { type: string; [k: string]: unknown }) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`))
      }

      try {
        send({ type: 'step', step: -1 })
        const result = await runAgent(
          message,
          { userId: workspaceId, sessionId: sid, category },
          previousMessages,
          send
        )
        await sql`
          insert into public.chat_messages (session_id, role, content, tool_calls)
          values (${sid}::uuid, 'assistant', ${result.text}, ${JSON.stringify(result.toolCalls)}::jsonb)
        `
        await sql`
          update public.chat_sessions set updated_at = now() where id = ${sid}::uuid
        `
        send({ type: 'done', sessionId: sid } as any)
      } catch (err) {
        send({ type: 'error', message: String(err) } as any)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
