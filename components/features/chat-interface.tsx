'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: Array<{ name: string; input?: unknown; output?: unknown }>
}

export function ChatInterface({ category }: { category?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || busy) return
    const userMsg = input.trim()
    setInput('')
    setBusy(true)
    const next: Message[] = [...messages, { role: 'user', content: userMsg }, { role: 'assistant', content: '', toolCalls: [] }]
    setMessages(next)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, sessionId, category }),
      })
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          const evt = JSON.parse(part.slice(6))
          setMessages((m) => {
            const copy = [...m]
            const last = copy[copy.length - 1]
            if (last.role !== 'assistant') return copy
            if (evt.type === 'text') {
              last.content += evt.text
            } else if (evt.type === 'tool_call') {
              last.toolCalls = [...(last.toolCalls ?? []), { name: evt.name, input: evt.input }]
            } else if (evt.type === 'tool_result') {
              if (last.toolCalls?.length) last.toolCalls[last.toolCalls.length - 1].output = evt.output
            } else if (evt.type === 'done') {
              if (evt.sessionId && !sessionId) setSessionId(evt.sessionId)
            }
            return copy
          })
        }
      }
    } catch (err) {
      setMessages((m) => [...m.slice(0, -1), { role: 'assistant', content: `Error: ${String(err)}` }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="max-w-xl mx-auto text-center text-muted-foreground mt-20">
            <p className="text-sm mb-4">Ask about your uploaded {category ?? 'federal'} documents.</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-left">
              <Example onClick={setInput}>Summarize the major deltas in this PB request vs the prior year</Example>
              <Example onClick={setInput}>Flag any repeat findings in this audit report</Example>
              <Example onClick={setInput}>Build a dashboard of obligation rate by quarter</Example>
              <Example onClick={setInput}>Compare these two contract cost proposals</Example>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn('max-w-3xl mx-auto mb-6', m.role === 'user' && 'flex justify-end')}>
            <div
              className={cn(
                'rounded-lg px-4 py-3',
                m.role === 'user' ? 'bg-secondary max-w-[85%]' : 'w-full'
              )}
            >
              {m.toolCalls && m.toolCalls.length > 0 && (
                <div className="mb-3 space-y-1">
                  {m.toolCalls.map((tc, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Wrench className="h-3 w-3" />
                      <span className="font-mono">{tc.name}</span>
                      {!tc.output && <Loader2 className="h-3 w-3 animate-spin" />}
                    </div>
                  ))}
                </div>
              )}
              <div className="prose-fed text-sm leading-relaxed whitespace-pre-wrap">
                {m.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                ) : (
                  m.content
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the agent…"
            className="resize-none min-h-[60px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            disabled={busy}
          />
          <Button onClick={send} disabled={busy || !input.trim()} size="icon">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Example({ children, onClick }: { children: string; onClick: (s: string) => void }) {
  return (
    <button
      onClick={() => onClick(children)}
      className="rounded-md border border-border bg-card p-2 hover:bg-accent transition text-left"
    >
      {children}
    </button>
  )
}
