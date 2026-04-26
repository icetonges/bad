'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Download, FileText, MessageSquare, FolderOpen, Loader2,
  CheckCircle2, AlertCircle, Package, FileDown, Table,
} from 'lucide-react'
import { formatDate, formatBytes } from '@/lib/utils'

interface Report { id: string; title: string; category: string; created_at: string }
interface Doc    { id: string; filename: string; category: string; size_bytes: number; created_at: string; storage_url: string; chunk_count?: number }
interface Session{ id: string; title: string; category: string; updated_at: string; message_count: number; first_question: string }

type ExportStatus = 'idle' | 'loading' | 'done' | 'error'

export default function ExportPage() {
  const [reports, setReports]   = useState<Report[]>([])
  const [docs, setDocs]         = useState<Doc[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading]   = useState(true)
  const [status, setStatus]     = useState<Record<string, ExportStatus>>({})

  useEffect(() => {
    Promise.all([
      fetch('/api/reports').then(r => r.json()),
      fetch('/api/upload').then(r => r.json()),
      fetch('/api/inquiries').then(r => r.json()),
    ]).then(([rData, dData, sData]) => {
      setReports(rData.reports ?? [])
      setDocs(dData.documents ?? [])
      setSessions(sData.sessions ?? [])
    }).finally(() => setLoading(false))
  }, [])

  function setItemStatus(id: string, s: ExportStatus) {
    setStatus(prev => ({ ...prev, [id]: s }))
  }

  // ── Individual exports ─────────────────────────────────────────

  async function downloadReport(r: Report) {
    setItemStatus(r.id, 'loading')
    try {
      const res = await fetch(`/api/reports?id=${r.id}`)
      const data = await res.json()
      const content = data.report?.content || ''
      blob(`${r.title}.md`, content, 'text/markdown')
      setItemStatus(r.id, 'done')
    } catch { setItemStatus(r.id, 'error') }
  }

  async function downloadInquiry(s: Session) {
    setItemStatus(s.id, 'loading')
    try {
      const res = await fetch(`/api/inquiries?id=${s.id}`)
      const data = await res.json()
      const text = (data.messages ?? [])
        .filter((m: any) => m.role === 'user' || m.role === 'assistant')
        .map((m: any) => `[${m.role.toUpperCase()}] ${m.content}`)
        .join('\n\n---\n\n')
      blob(`inquiry-${s.first_question?.slice(0, 40) || s.id}.txt`, text, 'text/plain')
      setItemStatus(s.id, 'done')
    } catch { setItemStatus(s.id, 'error') }
  }

  // ── Bulk exports ───────────────────────────────────────────────

  async function exportAllReports() {
    setItemStatus('all-reports', 'loading')
    try {
      const all = await Promise.all(reports.map(r =>
        fetch(`/api/reports?id=${r.id}`).then(res => res.json()).then(d => ({ title: r.title, content: d.report?.content ?? '' }))
      ))
      const combined = all.map(r => `# ${r.title}\n\n${r.content}`).join('\n\n---\n\n')
      blob(`FedFMMatter-all-reports-${today()}.md`, combined, 'text/markdown')
      setItemStatus('all-reports', 'done')
    } catch { setItemStatus('all-reports', 'error') }
  }

  async function exportAllInquiries() {
    setItemStatus('all-inquiries', 'loading')
    try {
      const all = await Promise.all(sessions.map(s =>
        fetch(`/api/inquiries?id=${s.id}`).then(r => r.json()).then(d => ({
          question: s.first_question,
          messages: (d.messages ?? []).filter((m: any) => m.role === 'user' || m.role === 'assistant')
        }))
      ))
      const combined = all.map(s =>
        `# ${s.question?.slice(0, 80) || 'Inquiry'}\n\n` +
        s.messages.map((m: any) => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n')
      ).join('\n\n═══════════════════════════════════\n\n')
      blob(`FedFMMatter-all-inquiries-${today()}.txt`, combined, 'text/plain')
      setItemStatus('all-inquiries', 'done')
    } catch { setItemStatus('all-inquiries', 'error') }
  }

  function exportDocumentManifest() {
    const rows = [
      ['Filename', 'Category', 'Size', 'Uploaded', 'Chunks', 'Storage URL'],
      ...docs.map(d => [d.filename, d.category, formatBytes(d.size_bytes), formatDate(d.created_at), String(d.chunk_count ?? 0), d.storage_url]),
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    blob(`FedFMMatter-document-manifest-${today()}.csv`, csv, 'text/csv')
  }

  async function exportObligationData() {
    setItemStatus('obligation', 'loading')
    try {
      const res = await fetch('/api/obligation-dashboard')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const rows = [
        ['Section', 'Label', 'Value ($B)', 'Notes'],
        ...data.multiYearChart.map((d: any) => ['Multi-Year', d.year, String(d.obligations), `BA ${d.budgetary_resources}B Outlays ${d.outlays}B Rate ${d.obligation_rate}%`]),
        ...data.categoryChart.map((d: any) => ['Award Category', d.category, String(d.amount_b), `${d.transactions} transactions`]),
        ...data.componentChart.map((d: any) => ['DoD Component', d.full_name, String(d.obligations_m / 1000), d.agency]),
        ...data.tasChart.map((d: any) => ['TAS Account', d.account, String(d.amount_b), d.account_name]),
        ...data.topAwards.map((d: any) => ['Top Contractor', d.recipient, String(d.amount_m / 1000), `${d.sub_agency} | ${d.award_type}`]),
      ]
      const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
      blob(`dod-obligations-${data.summary.label}.csv`, csv, 'text/csv')
      setItemStatus('obligation', 'done')
    } catch { setItemStatus('obligation', 'error') }
  }

  if (loading) return (
    <div className="p-8 flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading your workspace…
    </div>
  )

  return (
    <div className="p-8 max-w-5xl w-full">
      <header className="mb-8">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold mb-2">Workspace</p>
        <h1 className="text-2xl font-medium tracking-tight mb-1">Export center</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Download any report, conversation, document manifest, or live obligation data as Markdown, CSV, or plain text. Bulk export everything in one click.
        </p>
      </header>

      {/* Bulk export strip */}
      <section className="mb-8 rounded-lg border border-border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Bulk export</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          <BulkBtn id="all-reports" status={status['all-reports']} icon={FileText} label={`All reports (${reports.length})`} sub="Combined Markdown" onClick={exportAllReports} />
          <BulkBtn id="all-inquiries" status={status['all-inquiries']} icon={MessageSquare} label={`All inquiries (${sessions.length})`} sub="Plain text transcript" onClick={exportAllInquiries} />
          <BulkBtn id="doc-manifest" status={status['doc-manifest']} icon={FolderOpen} label={`Document manifest (${docs.length})`} sub="CSV with URLs and metadata" onClick={() => { exportDocumentManifest(); setItemStatus('doc-manifest', 'done') }} />
          <BulkBtn id="obligation" status={status['obligation']} icon={Table} label="Live obligation data" sub="CSV from USASpending.gov" onClick={exportObligationData} />
        </div>
      </section>

      {/* Reports */}
      <Section title="Reports" count={reports.length} link="/dashboard/reports" linkLabel="Open Reports">
        {reports.length === 0 ? (
          <Empty msg="No reports yet." link="/dashboard/chat" linkLabel="Ask the agent to generate one" />
        ) : reports.map(r => (
          <Row key={r.id} icon={FileText} iconColor="text-gold"
            title={r.title} sub={`${r.category} · ${formatDate(r.created_at)}`}
            status={status[r.id]}
            onDownload={() => downloadReport(r)}
            downloadLabel=".md"
          />
        ))}
      </Section>

      {/* Documents */}
      <Section title="Uploaded documents" count={docs.length} link="/dashboard/budget/library" linkLabel="Open Library">
        {docs.length === 0 ? (
          <Empty msg="No documents uploaded." link="/dashboard/budget/library" linkLabel="Upload files" />
        ) : docs.map(d => (
          <Row key={d.id} icon={FolderOpen} iconColor="text-blue-500"
            title={d.filename}
            sub={`${d.category} · ${formatBytes(d.size_bytes)} · ${d.chunk_count ?? 0} chunks · ${formatDate(d.created_at)}`}
            status={d.storage_url.startsWith('https://') ? undefined : 'idle'}
            onDownload={d.storage_url.startsWith('https://') ? () => window.open(d.storage_url, '_blank') : undefined}
            downloadLabel="Open"
            externalUrl={d.storage_url.startsWith('https://') ? d.storage_url : undefined}
          />
        ))}
      </Section>

      {/* Inquiries */}
      <Section title="Agent inquiries" count={sessions.length} link="/dashboard/inquiries" linkLabel="Open Archive">
        {sessions.length === 0 ? (
          <Empty msg="No conversations yet." link="/dashboard/chat" linkLabel="Start a conversation" />
        ) : sessions.map(s => (
          <Row key={s.id} icon={MessageSquare} iconColor="text-muted-foreground"
            title={s.first_question?.slice(0, 80) || 'Untitled inquiry'}
            sub={`${s.category || 'general'} · ${s.message_count} messages · ${formatDate(s.updated_at)}`}
            status={status[s.id]}
            onDownload={() => downloadInquiry(s)}
            downloadLabel=".txt"
          />
        ))}
      </Section>

    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────

function blob(filename: string, content: string, type: string) {
  const b = new Blob([content], { type })
  const url = URL.createObjectURL(b)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
function today() { return new Date().toISOString().slice(0, 10) }

function Section({ title, count, link, linkLabel, children }: { title: string; count: number; link: string; linkLabel: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title} <span className="text-muted-foreground/60">({count})</span></p>
        <Link href={link} className="text-xs text-gold hover:text-primary transition">{linkLabel} →</Link>
      </div>
      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {children}
      </div>
    </section>
  )
}

function Row({ icon: Icon, iconColor, title, sub, status, onDownload, downloadLabel, externalUrl }: {
  icon: any; iconColor: string; title: string; sub: string
  status?: ExportStatus; onDownload?: () => void; downloadLabel?: string; externalUrl?: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 group">
      <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{title}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
      {onDownload && (
        <button
          onClick={onDownload}
          disabled={status === 'loading'}
          className="flex items-center gap-1.5 text-xs border border-border rounded px-2.5 py-1 text-muted-foreground hover:text-gold hover:border-primary/60 transition shrink-0"
        >
          {status === 'loading' ? <Loader2 className="h-3 w-3 animate-spin" /> :
           status === 'done'    ? <CheckCircle2 className="h-3 w-3 text-green-600" /> :
           status === 'error'   ? <AlertCircle className="h-3 w-3 text-destructive" /> :
                                  <Download className="h-3 w-3" />}
          {status === 'done' ? 'Saved' : status === 'loading' ? '…' : downloadLabel}
        </button>
      )}
    </div>
  )
}

function BulkBtn({ id, status, icon: Icon, label, sub, onClick }: {
  id: string; status?: ExportStatus; icon: any; label: string; sub: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={status === 'loading'}
      className="text-left rounded-lg border border-border p-4 hover:border-primary/60 transition group"
    >
      <div className="flex items-start justify-between mb-2">
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-gold transition" />
        {status === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
         status === 'done'    ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> :
         status === 'error'   ? <AlertCircle className="h-3.5 w-3.5 text-destructive" /> :
                                <FileDown className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />}
      </div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </button>
  )
}

function Empty({ msg, link, linkLabel }: { msg: string; link: string; linkLabel: string }) {
  return (
    <div className="px-4 py-6 text-sm text-muted-foreground text-center">
      {msg} <Link href={link} className="text-gold hover:text-primary transition">{linkLabel} →</Link>
    </div>
  )
}
