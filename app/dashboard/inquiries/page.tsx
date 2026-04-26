'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  MessageSquare, Trash2, Loader2, ArrowLeft, Filter,
  ChevronRight, Clock, FileText, BarChart3, ShieldCheck,
  Coins, FileSignature, Wrench, Search, X, Download
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatDate, cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────

interface Session {
  id: string
  title: string
  category: string
  created_at: string
  updated_at: string
  message_count: number
  first_question: string
  last_response: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: unknown
  created_at: string
}

interface ToolCallData { name: string; input?: unknown; output?: unknown }

// ── Constants ──────────────────────────────────────────────────────

const CATEGORIES = [
  { id: '', label: 'All', icon: MessageSquare },
  { id: 'budget', label: 'Budget', icon: BarChart3 },
  { id: 'audit', label: 'Audit', icon: ShieldCheck },
  { id: 'accounting', label: 'Accounting', icon: Coins },
  { id: 'contracts', label: 'Contracts', icon: FileSignature },
]

const CATEGORY_COLORS: Record<string, string> = {
  budget: 'text-blue-500',
  audit: 'text-gold',
  accounting: 'text-green-600',
  contracts: 'text-purple-500',
}

const CATEGORY_BG: Record<string, string> = {
  budget: 'bg-blue-500/10',
  audit: 'bg-yellow-500/10',
  accounting: 'bg-green-500/10',
  contracts: 'bg-purple-500/10',
}

// ── Main page ──────────────────────────────────────────────────────

export default function InquiriesPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [thread, setThread] = useState<{ session: Session; messages: Message[] } | null>(null)
  const [threadLoading, setThreadLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadSessions = useCallback(async (cat: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = `/api/inquiries${cat ? `?category=${cat}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSessions(data.sessions ?? [])
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadSessions(category) }, [category, loadSessions])

  async function openThread(id: string) {
    if (selectedId === id && thread) return
    setSelectedId(id)
    setThreadLoading(true)
    try {
      const res = await fetch(`/api/inquiries?id=${id}`)
      const data = await res.json()
      setThread(data)
    } catch (e: any) {
      setThread(null)
    } finally {
      setThreadLoading(false)
    }
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this inquiry and all its messages?')) return
    setDeleting(id)
    try {
      await fetch(`/api/inquiries?id=${id}`, { method: 'DELETE' })
      setSessions(prev => prev.filter(s => s.id !== id))
      if (selectedId === id) { setSelectedId(null); setThread(null) }
    } catch {}
    finally { setDeleting(null) }
  }

  function exportThread() {
    if (!thread) return
    const text = thread.messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => `[${m.role.toUpperCase()}] ${m.content}`)
      .join('\n\n---\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${thread.session.title.slice(0, 50)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = search
    ? sessions.filter(s =>
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.first_question?.toLowerCase().includes(search.toLowerCase())
      )
    : sessions

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* ── Left panel: session list ─────────────────────────── */}
      <div className="w-80 flex-shrink-0 border-r border-border flex flex-col">
        {/* Header */}
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-medium">Inquiry archive</h1>
            <p className="text-[11px] text-muted-foreground">{filtered.length} conversation{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <Link
            href="/dashboard/chat"
            className="text-[11px] text-gold hover:text-primary transition flex items-center gap-1"
          >
            New <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Category filter */}
        <div className="border-b border-border px-3 py-2 flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                'text-[11px] px-2 py-1 rounded transition',
                category === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="border-b border-border px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search inquiries…"
              className="w-full pl-7 pr-7 py-1.5 text-xs bg-muted rounded border-0 outline-none focus:ring-1 ring-primary"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </div>
          )}
          {error && (
            <div className="p-3 m-3 rounded-md border border-destructive/40 bg-destructive/5 text-xs text-destructive">{error}</div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="p-5 text-sm text-muted-foreground">
              {search ? 'No matching inquiries.' : 'No inquiries yet. Ask the agent a question to start.'}
              {!search && (
                <Link href="/dashboard/chat" className="block mt-3 text-gold hover:text-primary transition text-xs">
                  Open agent →
                </Link>
              )}
            </div>
          )}
          {filtered.map(s => (
            <button
              key={s.id}
              onClick={() => openThread(s.id)}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-border group relative transition',
                selectedId === s.id ? 'bg-accent' : 'hover:bg-accent/50'
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className={cn('text-[10px] font-medium uppercase tracking-wider', CATEGORY_COLORS[s.category] ?? 'text-muted-foreground')}>
                  {s.category || 'general'}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={e => deleteSession(s.id, e)}
                    disabled={deleting === s.id}
                    className="text-muted-foreground hover:text-destructive p-0.5"
                  >
                    {deleting === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </button>
                </div>
              </div>
              <p className="text-sm font-medium truncate leading-snug mb-1">
                {s.first_question?.slice(0, 80) || s.title || 'Untitled'}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><MessageSquare className="h-2.5 w-2.5" />{s.message_count}</span>
                <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{formatDate(s.updated_at)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right panel: thread view ─────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground flex-col gap-3">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
            <p>Select an inquiry to view the full conversation</p>
            <Link href="/dashboard/chat" className="text-xs text-gold hover:text-primary transition">
              Start a new inquiry →
            </Link>
          </div>
        ) : threadLoading ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation…
          </div>
        ) : thread ? (
          <>
            {/* Thread header */}
            <div className="border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn('text-[10px] font-medium uppercase tracking-wider', CATEGORY_COLORS[thread.session.category] ?? 'text-muted-foreground')}>
                    {thread.session.category || 'general'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">{formatDate(thread.session.created_at)}</span>
                </div>
                <p className="text-sm font-medium">{thread.session.first_question?.slice(0, 100) || thread.session.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportThread}
                  className="text-xs text-muted-foreground hover:text-foreground transition flex items-center gap-1.5 border border-border rounded px-2.5 py-1.5"
                >
                  <Download className="h-3 w-3" /> Export
                </button>
                <Link
                  href={`/dashboard/chat?sessionId=${thread.session.id}&category=${thread.session.category}`}
                  className="text-xs text-gold hover:text-primary transition flex items-center gap-1.5 border border-border rounded px-2.5 py-1.5"
                >
                  <MessageSquare className="h-3 w-3" /> Continue
                </Link>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {thread.messages
                .filter(m => m.role === 'user' || m.role === 'assistant')
                .map((m, i) => (
                  <div key={m.id || i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-3xl rounded-lg px-4 py-3',
                      m.role === 'user' ? 'bg-secondary text-sm' : 'w-full'
                    )}>
                      {m.role === 'assistant' ? (
                        <div className="prose-fed text-sm leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{m.content}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-2">{formatDate(m.created_at)}</p>
                    </div>
                  </div>
                ))}

              {/* Tool calls summary */}
              {(() => {
                const toolMsgs = thread.messages.filter(m => m.role === 'assistant' && m.tool_calls)
                if (!toolMsgs.length) return null
                const allCalls = toolMsgs.flatMap(m => {
                  try { return JSON.parse(typeof m.tool_calls === 'string' ? m.tool_calls : JSON.stringify(m.tool_calls)) as ToolCallData[] }
                  catch { return [] }
                })
                if (!allCalls.length) return null
                return (
                  <div className="border border-border rounded-lg p-4 bg-card">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Wrench className="h-3 w-3" /> Tools used in this conversation
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(allCalls.map((c: any) => c.name))].map(name => (
                        <span key={name as string} className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                          {name as string}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
