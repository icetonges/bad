'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, ArrowRight, MessageSquare, AlertCircle, Trash2, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatDate } from '@/lib/utils'

interface Report {
  id: string
  title: string
  category: string
  content: string
  created_at: string
  skill_id?: string
}

const CATEGORY_COLORS: Record<string, string> = {
  budget: 'text-blue-500',
  audit: 'text-gold',
  accounting: 'text-green-600',
  contracts: 'text-purple-500',
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [selected, setSelected] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/reports')
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Failed to load reports')
      else setReports(data.reports ?? [])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function deleteReport(id: string) {
    if (!confirm('Delete this report?')) return
    setDeleting(id)
    try {
      await fetch(`/api/reports?id=${id}`, { method: 'DELETE' })
      setReports(prev => prev.filter(r => r.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch (e) {
      alert('Delete failed: ' + String(e))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* Sidebar list */}
      <div className="w-80 border-r border-border flex flex-col flex-shrink-0">
        <div className="h-14 border-b border-border flex items-center justify-between px-5">
          <h1 className="text-sm font-medium">Reports</h1>
          <span className="text-xs text-muted-foreground">{reports.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-5 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </div>
          )}

          {error && (
            <div className="p-4 m-3 rounded-md border border-destructive/40 bg-destructive/5 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {!loading && !error && reports.length === 0 && (
            <div className="p-5">
              <p className="text-sm text-muted-foreground mb-4">No reports yet.</p>
              <div className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground leading-relaxed">
                <p className="font-medium text-foreground mb-2">How to generate a report</p>
                <p className="mb-3">Ask the agent to analyze your documents, then end with: <span className="font-medium text-foreground">"save this as a report"</span></p>
                <p className="mb-3 text-[11px]">Example prompt:</p>
                <p className="italic text-[11px] mb-4">"Summarize the major findings in my audit documents and save the analysis as a report."</p>
                <Link
                  href="/dashboard/chat"
                  className="inline-flex items-center gap-1.5 text-gold hover:text-primary transition"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Open the agent
                </Link>
              </div>
            </div>
          )}

          {reports.map((r) => (
            <div key={r.id} className={`border-b border-border group relative ${selected?.id === r.id ? 'bg-accent' : 'hover:bg-accent/50'} transition`}>
              <button onClick={() => setSelected(r)} className="w-full text-left p-4 pr-10">
                <div className="flex items-start gap-2.5">
                  <FileText className={`h-4 w-4 mt-0.5 shrink-0 ${CATEGORY_COLORS[r.category] ?? 'text-muted-foreground'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {r.category} · {formatDate(r.created_at)}
                    </p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => deleteReport(r.id)}
                disabled={deleting === r.id}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition p-1"
              >
                {deleting === r.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="border-t border-border p-3">
          <Link
            href="/dashboard/chat"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition rounded-md p-2 hover:bg-accent"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Ask agent to generate a report</span>
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Link>
        </div>
      </div>

      {/* Report viewer */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <article className="max-w-3xl mx-auto p-8">
            <div className="mb-6">
              <p className={`text-[10px] font-medium tracking-[0.2em] uppercase mb-2 ${CATEGORY_COLORS[selected.category] ?? 'text-muted-foreground'}`}>
                {selected.category}
              </p>
              <h1 className="text-2xl font-medium tracking-tight mb-1">{selected.title}</h1>
              <p className="text-xs text-muted-foreground">{formatDate(selected.created_at)}</p>
            </div>
            <div className="prose-fed text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.content}</ReactMarkdown>
            </div>
          </article>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Select a report from the list
          </div>
        )}
      </div>
    </div>
  )
}
