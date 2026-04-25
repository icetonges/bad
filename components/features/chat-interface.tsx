'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, Wrench, BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────

interface ChartSpec {
  chart_type: 'bar' | 'horizontal_bar' | 'line' | 'pie' | 'stacked_bar' | 'area' | 'scatter'
  title: string
  subtitle?: string
  data: Record<string, unknown>[]
  x_key: string
  y_keys?: string[]
  format?: 'currency_b' | 'currency_m' | 'currency_k' | 'percentage' | 'count'
}

interface ToolCall {
  name: string
  input?: unknown
  output?: unknown
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCall[]
  charts?: ChartSpec[]
}

// ── Inline chart renderer using Chart.js via CDN ────────────────────

function InlineChart({ spec }: { spec: ChartSpec }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)

  const renderChart = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !window.Chart) return
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }

    const isDark = document.documentElement.classList.contains('dark')
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
    const tickColor = isDark ? '#9c9a92' : '#73726c'
    const COLORS = ['#1E5AA8','#D4AF37','#D4883A','#C04B2D','#5B4BC4','#4C9C6F','#888780','#1D9E75']

    const yKeys = spec.y_keys && spec.y_keys.length > 0
      ? spec.y_keys
      : spec.data.length > 0
        ? Object.keys(spec.data[0]).filter(k => k !== spec.x_key)
        : ['value']

    const fmt = (v: number) => {
      if (spec.format === 'currency_b') return `$${v}B`
      if (spec.format === 'currency_m') return `$${v}M`
      if (spec.format === 'currency_k') return `$${v}K`
      if (spec.format === 'percentage') return `${v}%`
      return String(v)
    }

    const labels = spec.data.map(d => String(d[spec.x_key] ?? ''))
    const isHorizontal = spec.chart_type === 'horizontal_bar'
    const isPie = spec.chart_type === 'pie'
    const isStacked = spec.chart_type === 'stacked_bar'

    let type: string = spec.chart_type
    if (type === 'horizontal_bar') type = 'bar'
    if (type === 'stacked_bar') type = 'bar'
    if (type === 'area') type = 'line'

    const datasets = isPie
      ? [{ data: spec.data.map(d => Number(d[yKeys[0]] ?? d['value'] ?? 0)), backgroundColor: COLORS }]
      : yKeys.map((key, i) => ({
          label: key,
          data: spec.data.map(d => Number(d[key] ?? 0)),
          backgroundColor: COLORS[i % COLORS.length],
          borderColor: COLORS[i % COLORS.length],
          fill: spec.chart_type === 'area',
          tension: 0.3,
          stack: isStacked ? 'stack' : undefined,
        }))

    const scaleOpts = {
      grid: { color: gridColor },
      ticks: { color: tickColor, font: { size: 11 }, callback: (v: number) => fmt(v) },
    }

    const options: any = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: isHorizontal ? 'y' : 'x',
      plugins: {
        legend: { display: yKeys.length > 1 || isPie, labels: { color: tickColor, font: { size: 11 } } },
        tooltip: {
          callbacks: { label: (ctx: any) => ` ${fmt(ctx.raw)}` },
        },
      },
      scales: isPie ? undefined : {
        x: isHorizontal ? scaleOpts : { ...scaleOpts, ticks: { color: tickColor, font: { size: 11 } }, grid: { color: gridColor } },
        y: isHorizontal
          ? { grid: { display: false }, ticks: { color: tickColor, font: { size: 11 } } }
          : { ...scaleOpts, stacked: isStacked },
      },
    }

    chartRef.current = new window.Chart(canvas, { type, data: { labels, datasets }, options })
  }, [spec])

  useEffect(() => {
    if (window.Chart) { setLoaded(true); return }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    script.onload = () => setLoaded(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (loaded) renderChart()
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [loaded, renderChart])

  return (
    <div className="rounded-lg border border-border bg-card p-4 my-3">
      <div className="flex items-center gap-2 mb-1">
        <BarChart2 className="h-3.5 w-3.5 text-gold" />
        <span className="text-sm font-medium">{spec.title}</span>
      </div>
      {spec.subtitle && <p className="text-xs text-muted-foreground mb-2">{spec.subtitle}</p>}
      <div style={{ height: 280, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

// Extend window type
declare global { interface Window { Chart: any } }

// ── Extract chart specs from tool call outputs ─────────────────────

function extractCharts(toolCalls: ToolCall[]): ChartSpec[] {
  const charts: ChartSpec[] = []
  for (const tc of toolCalls) {
    if (tc.name !== 'generate_chart') continue
    // Chart spec can be in input or output.chart
    const spec = (tc.output as any)?.chart ?? tc.input
    if (spec && spec.chart_type && spec.data && spec.x_key) {
      charts.push(spec as ChartSpec)
    }
  }
  return charts
}

// ── Main chat component ────────────────────────────────────────────

export function ChatInterface({ category, initialPrompt }: { category?: string; initialPrompt?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const autoSentRef = useRef(false)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function send(overrideMessage?: string) {
    const userMsg = (overrideMessage ?? input).trim()
    if (!userMsg || busy) return
    if (!overrideMessage) setInput('')
    setBusy(true)
    setMessages(prev => [...prev, { role: 'user', content: userMsg }, { role: 'assistant', content: '', toolCalls: [] }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, sessionId, category }),
      })
      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        throw new Error(`API ${res.status}: ${errBody.slice(0, 300)}`)
      }
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
          try {
            const evt = JSON.parse(part.slice(6))
            setMessages(prev => {
              const copy = [...prev]
              const last = { ...copy[copy.length - 1] }
              if (last.role !== 'assistant') return prev
              copy[copy.length - 1] = last

              if (evt.type === 'text') {
                last.content = (last.content || '') + evt.text
              } else if (evt.type === 'tool_call') {
                last.toolCalls = [...(last.toolCalls ?? []), { name: evt.name, input: evt.input }]
              } else if (evt.type === 'tool_result') {
                const tcs = [...(last.toolCalls ?? [])]
                if (tcs.length > 0) {
                  tcs[tcs.length - 1] = { ...tcs[tcs.length - 1], output: evt.output }
                  last.toolCalls = tcs
                  // Extract charts immediately so they render as they arrive
                  last.charts = extractCharts(tcs)
                }
              } else if (evt.type === 'done') {
                if (evt.sessionId && !sessionId) setSessionId(evt.sessionId)
                // Final chart extraction after all tool calls complete
                if (last.toolCalls) last.charts = extractCharts(last.toolCalls)
              } else if (evt.type === 'error') {
                last.content = (last.content || '') + `\n\n**Error:** ${evt.message || 'Unknown server error'}`
              }
              return copy
            })
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: `Error: ${String(err)}` }])
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (initialPrompt && !autoSentRef.current && !busy && messages.length === 0) {
      autoSentRef.current = true
      send(initialPrompt)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="max-w-xl mx-auto text-center text-muted-foreground mt-20">
            <p className="text-sm mb-4">Ask about your uploaded {category ?? 'federal'} documents.</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-left">
              <Example onClick={setInput}>Build a bar chart of FY27 appropriation totals by title from my documents</Example>
              <Example onClick={setInput}>Summarize the major deltas in this PB request vs the prior year</Example>
              <Example onClick={setInput}>Flag any repeat findings in this audit report</Example>
              <Example onClick={setInput}>Compare these contract cost proposals and show a chart</Example>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn('max-w-3xl mx-auto mb-6', m.role === 'user' && 'flex justify-end')}>
            <div className={cn('rounded-lg px-4 py-3', m.role === 'user' ? 'bg-secondary max-w-[85%]' : 'w-full')}>

              {/* Tool call indicators */}
              {m.toolCalls && m.toolCalls.length > 0 && (
                <div className="mb-3 space-y-1">
                  {m.toolCalls.map((tc, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Wrench className="h-3 w-3" />
                      <span className="font-mono">{tc.name}</span>
                      {tc.name === 'generate_chart' && tc.output
                        ? <span className="text-gold">→ chart rendered below</span>
                        : !tc.output
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : null
                      }
                    </div>
                  ))}
                </div>
              )}

              {/* Charts — rendered inline before the text response */}
              {m.charts && m.charts.map((spec, j) => (
                <InlineChart key={j} spec={spec} />
              ))}

              {/* Text content */}
              {m.content && (
                <div className="prose-fed text-sm leading-relaxed">
                  {m.role === 'assistant'
                    ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    : m.content
                  }
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
            placeholder="Ask the agent… (tip: ask it to 'produce a chart of…' for inline visualizations)"
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
