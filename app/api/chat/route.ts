import { NextRequest } from 'next/server'
import { runAgent, type AgentEvent } from '@/lib/agent/agent'
import { createServerSupabase, createAdminSupabase } from '@/lib/db/supabase'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { message, sessionId, category } = await req.json()
  if (!message) return new Response(JSON.stringify({ error: 'message required' }), { status: 400 })

  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

  const admin = createAdminSupabase()

  let sid = sessionId
  if (!sid) {
    const { data: s } = await admin
      .from('chat_sessions')
      .insert({ user_id: user.id, category: category ?? null, title: message.slice(0, 80) })
      .select()
      .single()
    sid = s?.id
  }

  await admin.from('chat_messages').insert({ session_id: sid, role: 'user', content: message })

  const { data: history } = await admin
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sid)
    .order('created_at', { ascending: true })
    .limit(40)

  const previousMessages = (history ?? []).slice(0, -1).map((m) => ({ role: m.role, content: m.content }))

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (evt: AgentEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`))
      }

      try {
        send({ type: 'step', step: -1, stop_reason: 'init' })
        const result = await runAgent(
          message,
          { userId: user.id, sessionId: sid, category },
          previousMessages,
          send
        )
        await admin.from('chat_messages').insert({
          session_id: sid,
          role: 'assistant',
          content: result.text,
          tool_calls: result.toolCalls,
        })
        await admin
          .from('chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', sid)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', sessionId: sid })}\n\n`))
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`)
        )
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
