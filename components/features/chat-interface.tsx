'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, Wrench, BarChart2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────

interface ChartSpec {
  chart_type: string
  title: string
  subtitle?: string
  data: Record<string, unknown>[]
  x_key: string
  y_keys?: string[]
  format?: string
}

interface ToolCall { name: string; input?: unknown; output?: unknown; done?: boolean }

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCall[]
  charts?: ChartSpec[]
  error?: string
}

// ── Chart renderer ─────────────────────────────────────────────────

function InlineChart({ spec }: { spec: ChartSpec }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)
  const [ready, setReady] = useState(typeof window !== 'undefined' && !!(window as any).Chart)

  useEffect(() => {
    if ((window as any).Chart) { setReady(true); return }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    s.onload = () => setReady(true)
    document.head.appendChild(s)
  }, [])

  useEffect(() => {
    if (!ready || !canvasRef.current || !(window as any).Chart) return
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }

    const isDark = document.documentElement.classList.contains('dark')
    const gridC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
    const tickC = isDark ? '#9c9a92' : '#73726c'
    const COLORS = ['#1E5AA8','#D4AF37','#D4883A','#C04B2D','#5B4BC4','#4C9C6F','#888780','#1D9E75','#E07B3A','#6B4BC4']

    const yKeys = spec.y_keys?.length
      ? spec.y_keys
      : spec.data.length ? Object.keys(spec.data[0]).filter(k => k !== spec.x_key && k !== 'color') : ['value']

    const fmt = (v: number) => {
      if (spec.format === 'currency_b') return `$${v}B`
      if (spec.format === 'currency_m') return `$${v}M`
      if (spec.format === 'percentage') return `${v}%`
      return String(v)
    }

    const labels = spec.data.map(d => String(d[spec.x_key] ?? ''))
    const isH = spec.chart_type === 'horizontal_bar'
    const isPie = spec.chart_type === 'pie'
    const isStacked = spec.chart_type === 'stacked_bar'
    const isArea = spec.chart_type === 'area'
    let type = isPie ? 'pie' : isH ? 'bar' : isArea ? 'line' : spec.chart_type === 'stacked_bar' ? 'bar' : spec.chart_type

    const datasets = isPie
      ? [{ data: spec.data.map(d => Number(d[yKeys[0]] ?? 0)), backgroundColor: spec.data.map((d, i) => String((d as any).color ?? COLORS[i % COLORS.length])) }]
      : yKeys.map((k, i) => ({
          label: k,
          data: spec.data.map(d => Number(d[k] ?? 0)),
          backgroundColor: spec.data.map((d: any) => d.color ?? COLORS[i % COLORS.length]),
          borderColor: COLORS[i % COLORS.length],
          fill: isArea,
          tension: 0.3,
          stack: isStacked ? 'a' : undefined,
        }))

    const scaleBase = { grid: { color: gridC }, ticks: { color: tickC, font: { size: 11 } } }

    chartRef.current = new (window as any).Chart(canvasRef.current, {
      type,
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: isH ? 'y' : 'x',
        plugins: {
          legend: { display: isPie || yKeys.length > 1, labels: { color: tickC, font: { size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: (ctx: any) => ` ${fmt(Number(ctx.raw))}` } },
        },
        scales: isPie ? undefined : {
          x: isH ? { ...scaleBase, ticks: { ...scaleBase.ticks, callback: (v: number) => fmt(v) } } : { ...scaleBase, stacked: isStacked },
          y: isH ? { grid: { display: false }, ticks: { color: tickC, font: { size: 10 } } } : { ...scaleBase, stacked: isStacked, ticks: { ...scaleBase.ticks, callback: (v: number) => fmt(v) } },
        },
      },
    })

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [ready, spec])

  return (
    <div className="rounded-lg border border-border bg-card p-4 my-3">
      <div className="flex items-center gap-2 mb-1">
        <BarChart2 className="h-3.5 w-3.5 text-gold" />
        <span className="text-sm font-medium">{spec.title}</span>
      </div>
      {spec.subtitle && <p className="text-xs text-muted-foreground mb-2">{spec.subtitle}</p>}
      {!ready && <div className="h-64 flex items-center justify-center text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading chart…</div>}
      <div style={{ height: 280, position: 'relative', display: ready ? 'block' : 'none' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

function extractCharts(toolCalls: ToolCall[]): ChartSpec[] {
  return toolCalls
    .filter(tc => tc.name === 'generate_chart' && tc.done)
    .map(tc => {
      const spec = (tc.output as any)?.chart ?? tc.input
      if (spec?.chart_type && spec?.data && spec?.x_key) return spec as ChartSpec
      return null
    })
    .filter(Boolean) as ChartSpec[]
}

// ── Status bar ─────────────────────────────────────────────────────

function StatusBar({ status, model }: { status: string; model?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 px-1">
      <Loader2 className="h-3 w-3 animate-spin shrink-0" />
      <span>{status}</span>
      {model && <span className="text-[10px] text-muted-foreground/60 border border-border rounded px-1.5 py-0.5">{model}</span>}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────

export function ChatInterface({ category, initialPrompt }: { category?: string; initialPrompt?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [currentModel, setCurrentModel] = useState<string | undefined>()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const autoSentRef = useRef(false)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, status])

  const send = useCallback(async (overrideMessage?: string) => {
    const userMsg = (overrideMessage ?? input).trim()
    if (!userMsg || busy) return
    if (!overrideMessage) setInput('')
    setBusy(true)
    setStatus('Connecting…')
    setCurrentModel(undefined)

    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMsg },
      { role: 'assistant', content: '', toolCalls: [], charts: [] },
    ])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, sessionId, category }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}: ${await res.text().catch(() => '')}`)
      if (!res.body) throw new Error('No response stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          let evt: any
          try { evt = JSON.parse(part.slice(6)) } catch { continue }

          if (evt.type === 'status') {
            setStatus(evt.message)
          } else if (evt.type === 'provider') {
            setCurrentModel(evt.model)
          } else if (evt.type === 'text') {
            setStatus(null)
            setMessages(prev => {
              const copy = [...prev]
              const last = { ...copy[copy.length - 1] }
              last.content = (last.content ?? '') + evt.text
              copy[copy.length - 1] = last
              return copy
            })
          } else if (evt.type === 'tool_call') {
            setStatus(null)
            setMessages(prev => {
              const copy = [...prev]
              const last = { ...copy[copy.length - 1] }
              last.toolCalls = [...(last.toolCalls ?? []), { name: evt.name, input: evt.input }]
              copy[copy.length - 1] = last
              return copy
            })
          } else if (evt.type === 'tool_result') {
            setMessages(prev => {
              const copy = [...prev]
              const last = { ...copy[copy.length - 1] }
              const tcs = [...(last.toolCalls ?? [])]
              const idx = tcs.findLastIndex(tc => tc.name === evt.name && !tc.done)
              if (idx >= 0) tcs[idx] = { ...tcs[idx], output: evt.output, done: true }
              last.toolCalls = tcs
              last.charts = extractCharts(tcs)
              copy[copy.length - 1] = last
              return copy
            })
          } else if (evt.type === 'error') {
            setStatus(null)
            setMessages(prev => {
              const copy = [...prev]
              const last = { ...copy[copy.length - 1] }
              last.error = evt.message
              copy[copy.length - 1] = last
              return copy
            })
          } else if (evt.type === 'done') {
            if (evt.sessionId && !sessionId) setSessionId(evt.sessionId)
            // Final chart extraction
            setMessages(prev => {
              const copy = [...prev]
              const last = { ...copy[copy.length - 1] }
              last.charts = extractCharts(last.toolCalls ?? [])
              copy[copy.length - 1] = last
              return copy
            })
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { ...copy[copy.length - 1], error: err?.message || String(err) }
        return copy
      })
    } finally {
      setBusy(false)
      setStatus(null)
      setCurrentModel(undefined)
    }
  }, [input, busy, sessionId, category])

  useEffect(() => {
    if (initialPrompt && !autoSentRef.current && !busy && messages.length === 0) {
      autoSentRef.current = true
      send(initialPrompt)
    }
  }, [initialPrompt, busy, messages.length, send])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && !busy && (
          <div className="max-w-xl mx-auto text-center text-muted-foreground mt-20">
            <p className="text-sm mb-4">Ask about your uploaded {category ?? 'federal'} documents.</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-left">
              <Example onClick={s => { setInput(s); }}>Build a bar chart of top weapon systems by total cost</Example>
              <Example onClick={s => { setInput(s); }}>Summarize major program deltas vs prior year enacted</Example>
              <Example onClick={s => { setInput(s); }}>Flag all repeat audit findings and CAP status</Example>
              <Example onClick={s => { setInput(s); }}>Show obligation rates by appropriation title with a chart</Example>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn('max-w-3xl mx-auto mb-6', m.role === 'user' && 'flex justify-end')}>
            <div className={cn('rounded-lg px-4 py-3', m.role === 'user' ? 'bg-secondary max-w-[85%]' : 'w-full')}>

              {/* Tool call list */}
              {m.toolCalls && m.toolCalls.length > 0 && (
                <div className="mb-3 space-y-1">
                  {m.toolCalls.map((tc, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                      {tc.done
                        ? <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                        : <Wrench className="h-3 w-3 shrink-0" />}
                      <span className="font-mono">{tc.name}</span>
                      {!tc.done && i === messages.length - 1 && busy && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      {tc.name === 'generate_chart' && tc.done && (
                        <span className="text-gold text-[10px]">chart below ↓</span>
                      )}
                      {tc.name === 'retrieve_chunks' && tc.done && (
                        <span className="text-[10px] text-muted-foreground/60">
                          {(() => {
                            const out = tc.output as any
                            const n = out?.passages?.length ?? 0
                            return n > 0 ? `${n} passage${n !== 1 ? 's' : ''} found` : out?.note ?? ''
                          })()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Status (only on last assistant message while busy) */}
              {i === messages.length - 1 && m.role === 'assistant' && busy && status && (
                <StatusBar status={status} model={currentModel} />
              )}

              {/* Charts */}
              {m.charts && m.charts.map((spec, j) => <InlineChart key={j} spec={spec} />)}

              {/* Text */}
              {m.content && (
                <div className="prose-fed text-sm leading-relaxed">
                  {m.role === 'assistant'
                    ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    : m.content}
                </div>
              )}

              {/* Error */}
              {m.error && (
                <div className="mt-2 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{m.error}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={busy ? 'Agent is working…' : 'Ask the agent… ask for charts, analysis, summaries'}
            className="resize-none min-h-[60px]"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            disabled={busy}
          />
          <Button onClick={() => send()} disabled={busy || !input.trim()} size="icon">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Example({ children, onClick }: { children: string; onClick: (s: string) => void }) {
  return (
    <button onClick={() => onClick(children)} className="rounded-md border border-border bg-card p-2 hover:bg-accent transition text-left">
      {children}
    </button>
  )
}
