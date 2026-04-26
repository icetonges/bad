'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight, ShieldCheck, ClipboardCheck, AlertTriangle,
  RefreshCw, FolderOpen, FileCheck, FileStack, Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface PulseData {
  total_docs: number
  indexed_docs: number
  total_chunks: number
  open_findings: number | null
  opinion_score: string | null
}

function usePulseStats() {
  const [stats, setStats] = useState<PulseData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/audit/pulse')
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => setStats({ total_docs: 0, indexed_docs: 0, total_chunks: 0, open_findings: null, opinion_score: null }))
      .finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}

export default function AuditPage() {
  const { stats, loading } = usePulseStats()

  const hasDocuments = (stats?.total_docs ?? 0) > 0
  const allIndexed = hasDocuments && stats?.indexed_docs === stats?.total_docs
  const someUnindexed = hasDocuments && (stats?.indexed_docs ?? 0) < (stats?.total_docs ?? 0)

  return (
    <div className="p-8 max-w-6xl w-full">
      <header className="mb-8">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold mb-2">Audit & Assurance</p>
        <h1 className="text-2xl font-medium tracking-tight mb-1">Findings tracker</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Track GAO and IG findings, OMB Circular A-123 work, FMFIA and FFMIA reporting. The agent separates material weaknesses from significant deficiencies, flags repeat findings, and evaluates CAP milestone progress.
        </p>
      </header>

      {/* Featured analysis */}
      <section className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Featured analysis</p>
        <Link href="/dashboard/audit/inside" className="group block">
          <Card className="transition hover:border-primary/60">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <FileStack className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-gold">Inside analysis</span>
                    <span className="text-[10px] text-muted-foreground">· DODIG-2026-032 / FY28 roadmap</span>
                  </div>
                  <h3 className="font-medium text-base mb-1.5">FY2025 audit, FY2028 clean-opinion goal, and Advana as the bridge</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    A portfolio manager's reference to the 8th consecutive disclaimer: 26 material weaknesses, $1T+ in exposed balances, FY28 agency-wide commitment, and how Advana's data platform, UoT engine, and agentic AI close the gap.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>14 sections</span><span>·</span><span>10 AI/ML remediation plays</span><span>·</span><span>USMC playbook</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Pulse — live data */}
      <section className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Pulse</p>

        {someUnindexed && (
          <div className="mb-3 rounded-md border border-gold/40 bg-gold/5 p-3 text-xs text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-gold shrink-0" />
            {stats!.total_docs - stats!.indexed_docs} document(s) uploaded but not indexed.{' '}
            <Link href="/dashboard/audit/library" className="text-gold underline underline-offset-2">Go to library → Re-embed</Link>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-4">
          {/* Documents uploaded */}
          <PulseCard
            icon={FolderOpen}
            label="Documents uploaded"
            value={loading ? '…' : String(stats?.total_docs ?? 0)}
            sub={loading ? 'Loading…' : hasDocuments ? `${stats!.indexed_docs} of ${stats!.total_docs} indexed` : 'Upload audit files to start'}
            tone={!hasDocuments ? 'neutral' : allIndexed ? 'ok' : 'warning'}
          />

          {/* Searchable chunks */}
          <PulseCard
            icon={ShieldCheck}
            label="Searchable passages"
            value={loading ? '…' : String(stats?.total_chunks ?? 0)}
            sub={loading ? 'Loading…' : stats?.total_chunks ? 'Ready for agent analysis' : 'Index your documents first'}
            tone={stats?.total_chunks ? 'ok' : 'neutral'}
          />

          {/* Open findings */}
          <PulseCard
            icon={AlertTriangle}
            label="Open findings"
            value={loading ? '…' : stats?.open_findings != null ? String(stats.open_findings) : '—'}
            sub={loading ? 'Loading…' : stats?.open_findings != null ? '26 MWs · 2 SDs · FY2025 (DODIG-2026-032)' : hasDocuments ? 'Ask agent to count findings' : 'Upload IG/GAO reports first'}
            tone={stats?.open_findings != null ? 'destructive' : 'neutral'}
            actionHref={hasDocuments ? `/dashboard/chat?category=audit&prompt=${encodeURIComponent('Count and list all open findings in my uploaded audit documents. Separate material weaknesses from significant deficiencies.')}` : undefined}
          />

          {/* Opinion readiness */}
          <PulseCard
            icon={FileCheck}
            label="Current opinion"
            value={loading ? '…' : stats?.opinion_score ?? '—'}
            sub={loading ? 'Loading…' : stats?.opinion_score === 'Disclaimer' ? 'FY2025 — 8th consecutive disclaimer' : stats?.opinion_score ? `Detected from uploaded documents` : hasDocuments ? 'Ask agent for assessment' : 'Upload audit reports first'}
            tone={stats?.opinion_score === 'Disclaimer' ? 'destructive' : stats?.opinion_score === 'Clean' ? 'ok' : 'neutral'}
            actionHref={hasDocuments ? `/dashboard/chat?category=audit&prompt=${encodeURIComponent('Assess the likelihood of achieving an improved audit opinion in the next cycle based on my uploaded documents.')}` : undefined}
          />
        </div>
      </section>

      {/* Quick actions */}
      <section className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Quick actions</p>
        <div className="grid gap-3 md:grid-cols-2">
          <QuickAction
            prompt="Summarize all findings and recommendations in my uploaded audit documents. Separate material weaknesses from significant deficiencies. Flag repeat findings. Produce a chart of findings by category."
            icon={ShieldCheck}
            title="Summarize findings"
            copy="All findings by type, with repeat-finding flags and a breakdown chart."
          />
          <QuickAction
            prompt="Build a Corrective Action Plan status table from my uploaded documents. Show open vs closed, due dates, owners, and whether each is on track."
            icon={ClipboardCheck}
            title="CAP status table"
            copy="Open vs closed corrective actions, milestone dates, assigned owners."
          />
          <QuickAction
            prompt="Assess the likelihood of achieving an improved audit opinion in the next cycle based on findings in my uploaded documents. Reference FMFIA, FFMIA, A-123 where applicable. Be specific about which material weaknesses are closest to closure."
            icon={FileCheck}
            title="Opinion readiness assessment"
            copy="Closure likelihood per weakness, referencing FMFIA/FFMIA/A-123."
          />
          <QuickAction
            prompt="Compare findings in my uploaded audit reports across years. Identify trend patterns and recurring issues. Show a chart of finding counts over time."
            icon={RefreshCw}
            title="Year-over-year trend"
            copy="Multi-year finding trend with chart — flag anything recurring 3+ years."
          />
        </div>
      </section>

      {/* Document library */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Document library</p>
          <Link href="/dashboard/audit/library" className="text-xs text-gold hover:text-primary transition inline-flex items-center gap-1">
            Open library <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <Link href="/dashboard/audit/library" className="block rounded-lg border border-dashed border-border bg-card p-6 text-center hover:border-primary/60 transition">
          <FolderOpen className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">Upload audit documents</p>
          <p className="text-xs text-muted-foreground">
            {hasDocuments
              ? `${stats!.total_docs} document(s) in library · ${stats!.total_chunks} passages indexed`
              : 'GAO reports, IG findings, OMB A-123 workpapers, management responses, CAP tracking sheets.'}
          </p>
        </Link>
      </section>
    </div>
  )
}

function PulseCard({
  icon: Icon, label, value, sub, tone, actionHref,
}: {
  icon: any; label: string; value: string; sub: string
  tone: 'destructive' | 'warning' | 'ok' | 'neutral'
  actionHref?: string
}) {
  const toneClass =
    tone === 'destructive' ? 'text-destructive' :
    tone === 'warning' ? 'text-gold' :
    tone === 'ok' ? 'text-green-600' : 'text-muted-foreground'

  const content = (
    <div className={`rounded-lg border border-border bg-card p-4 h-full ${actionHref ? 'hover:border-primary/60 transition cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <Icon className={`h-3.5 w-3.5 ${toneClass}`} />
      </div>
      <div className="text-2xl font-medium tracking-tight mb-1">
        {value === '…' ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : value}
      </div>
      <div className="text-[11px] text-muted-foreground leading-tight">{sub}</div>
      {actionHref && (
        <div className="mt-2 text-[10px] text-gold">Click to ask agent →</div>
      )}
    </div>
  )

  return actionHref ? <Link href={actionHref}>{content}</Link> : content
}

function QuickAction({ prompt, icon: Icon, title, copy }: { prompt: string; icon: any; title: string; copy: string }) {
  return (
    <Link
      href={`/dashboard/chat?category=audit&prompt=${encodeURIComponent(prompt)}`}
      className="group rounded-lg border border-border bg-card p-4 transition hover:border-primary/60"
    >
      <div className="flex items-start gap-3">
        <Icon className="h-4 w-4 text-gold shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm mb-1">{title}</div>
          <div className="text-xs text-muted-foreground leading-relaxed">{copy}</div>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition mt-0.5" />
      </div>
    </Link>
  )
}
