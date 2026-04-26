import Link from 'next/link'
import { ArrowRight, Coins, Clock, TrendingDown, AlertTriangle, FolderOpen, Receipt, Calculator, RefreshCw, Database, ExternalLink, CheckCircle2 } from 'lucide-react'

export default function AccountingPage() {
  return (
    <div className="p-8 max-w-6xl w-full">
      <header className="mb-8">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold mb-2">Accounting & Execution</p>
        <h1 className="text-2xl font-medium tracking-tight mb-1">Obligation analysis</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Budget execution the USSGL way. Track obligation rates by quarter, flag aging ULOs, identify expiring-year cancellation risk, and distinguish budget authority from obligations from outlays. Live DoD data pulled weekly from USASpending.gov.
        </p>
      </header>

      {/* USASpending live data feed status */}
      <section className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Live data feed — USASpending.gov</p>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Database className="h-4 w-4 text-gold mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium mb-1">DoD obligation data — automated weekly pull</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                  A GitHub Action runs every Sunday and pulls current-period DoD obligation totals, federal account breakdowns, and top contract awards from the USASpending.gov API. The data is automatically chunked, embedded, and added to the accounting knowledge base — no manual upload needed.
                </p>
                <div className="flex flex-wrap gap-3 mt-3">
                  <DataBadge label="Agency obligations" />
                  <DataBadge label="Federal accounts" />
                  <DataBadge label="Budget functions" />
                  <DataBadge label="Top contract awards" />
                  <DataBadge label="Obligation rates" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <a
                href="https://api.usaspending.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" /> USASpending API
              </a>
              <a
                href="https://github.com/icetonges/bad/actions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> GitHub Actions
              </a>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Setup required</p>
            <ol className="space-y-1 text-xs text-muted-foreground">
              <li><span className="text-foreground font-medium">1.</span> In Vercel → Settings → Environment Variables, add <code className="bg-muted px-1 rounded text-[11px]">INGEST_SECRET</code> with any long random string.</li>
              <li><span className="text-foreground font-medium">2.</span> In GitHub → your repo → Settings → Secrets and variables → Actions, add two secrets:</li>
              <li className="pl-4"><code className="bg-muted px-1 rounded text-[11px]">INGEST_URL</code> = <code className="bg-muted px-1 rounded text-[11px]">https://fedfm.vercel.app/api/ingest</code></li>
              <li className="pl-4"><code className="bg-muted px-1 rounded text-[11px]">INGEST_SECRET</code> = same value as in Vercel</li>
              <li><span className="text-foreground font-medium">3.</span> Push this code to GitHub. The Action runs automatically every Sunday, or trigger it manually from the Actions tab.</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Quick actions</p>
        <div className="grid gap-3 md:grid-cols-2">
          <QuickAction
            prompt="Calculate obligation rates by quarter and by appropriation from my uploaded execution data. Flag unusual patterns — back-loaded, Q4 spikes, expiring funds."
            icon={TrendingDown}
            title="Obligation rate analysis"
            copy="Quarterly obligation rates by TAFS. Flag Q4 spikes, back-loading, expiring fund risk."
          />
          <QuickAction
            prompt="Analyze Unliquidated Obligations in my uploaded documents. Identify stale ULOs, aging buckets, and cancellation risk."
            icon={Clock}
            title="ULO / UDO analysis"
            copy="Stale and aging ULOs by age bucket. Highlight cancellation-risk exposure."
          />
          <QuickAction
            prompt="Build a Treasury Appropriation Fund Symbol summary from my uploaded documents, including period of availability and cancellation dates."
            icon={Receipt}
            title="TAFS summary"
            copy="Period-of-availability table across TAFS with cancellation dates and status."
          />
          <QuickAction
            prompt="Compare budget authority, obligations, and outlays across my uploaded documents. Produce a chart and identify execution gaps."
            icon={Calculator}
            title="BA vs Obligations vs Outlays"
            copy="Three-way comparison with waterfall chart. Identify execution-timing gaps."
          />
          <QuickAction
            prompt="Break down spending by object class code (OC 11, 21, 22, 25, 31, 32) from my uploaded documents. Identify major cost drivers."
            icon={Coins}
            title="Object class breakdown"
            copy="Spending by OC category. Surface major cost drivers (personnel, contracts, equipment)."
          />
          <QuickAction
            prompt="Review my uploaded financial statements for FFMIA compliance issues, USSGL posting anomalies, and any indicators of Anti-Deficiency Act risk."
            icon={AlertTriangle}
            title="Compliance red flags"
            copy="FFMIA compliance, USSGL posting anomalies, ADA risk indicators."
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Document library</p>
          <Link href="/dashboard/accounting/library" className="text-xs text-gold hover:text-primary transition inline-flex items-center gap-1">
            Open library <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <Link href="/dashboard/accounting/library" className="block rounded-lg border border-dashed border-border bg-card p-6 text-center hover:border-primary/60 transition">
          <FolderOpen className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">Upload accounting and execution data</p>
          <p className="text-xs text-muted-foreground">Financial statements, SF-133 reports, execution reports, obligations/outlays data, USSGL trial balances.</p>
        </Link>
      </section>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, sub, warning }: { icon: any; label: string; value: string; sub: string; warning?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <Icon className={`h-3.5 w-3.5 ${warning ? 'text-gold' : 'text-muted-foreground'}`} />
      </div>
      <div className="text-2xl font-medium tracking-tight mb-1">{value}</div>
      <div className="text-[11px] text-muted-foreground leading-tight">{sub}</div>
    </div>
  )
}

function QuickAction({ prompt, icon: Icon, title, copy }: { prompt: string; icon: any; title: string; copy: string }) {
  return (
    <Link
      href={`/dashboard/chat?category=accounting&prompt=${encodeURIComponent(prompt)}`}
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

function DataBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-green-600/10 text-green-600 border border-green-600/20">
      <CheckCircle2 className="h-2.5 w-2.5" /> {label}
    </span>
  )
}
