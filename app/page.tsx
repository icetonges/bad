import Link from 'next/link'
import {
  ArrowRight, BarChart3, ShieldCheck, Coins, FileSignature,
  Bot, Database, FileCheck,
} from 'lucide-react'
import { ThemeToggle } from '@/components/features/theme-toggle'

export default function Landing() {
  return (
    <div className="min-h-screen">

      {/* ── Nav ── */}
      <nav className="border-b border-border sticky top-0 z-40 bg-background/95 backdrop-blur">
        <div className="container flex h-13 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-medium text-sm tracking-tight">
            <span className="text-gold">◆</span>
            <span>FedFMMatter</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition">Workspace</Link>
            <Link href="/dashboard/chat" className="text-muted-foreground hover:text-foreground transition">Ask</Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition">About</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── Featured analyses — first thing after nav ── */}
      <section className="container pt-8 pb-8">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
          Featured analyses
        </p>
        <div className="grid md:grid-cols-2 gap-4">

          {/* PB27 */}
          <Link href="/dashboard/budget/pb27" className="group rounded-lg border border-border bg-card p-6 hover:border-primary/60 transition block">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-gold mb-1">
                  Budget & Programs · Inside analysis
                </p>
                <h3 className="font-medium text-base leading-snug">
                  FY 2027 Department of War Budget
                </h3>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition shrink-0 mt-1" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              A portfolio manager's reference to the $1.45T request — topline architecture, the $350B mandatory tranche, procurement across 19 appropriation titles, MAC munitions, AI/autonomy portfolio, and Advana → WDP restructuring.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border mb-3">
              <Stat value="$1.45T" label="Total request" />
              <Stat value="243×" label="DAWG growth" gold />
              <Stat value="$46B" label="Sovereign AI" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['12 sections', '8 charts', 'Winners & losers', 'Execution risks'].map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
              ))}
            </div>
          </Link>

          {/* Audit Inside */}
          <Link href="/dashboard/audit/inside" className="group rounded-lg border border-border bg-card p-6 hover:border-primary/60 transition block">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-gold mb-1">
                  Audit & Assurance · Inside analysis
                </p>
                <h3 className="font-medium text-base leading-snug">
                  DoD FY2025 Audit — path to FY2028 clean opinion
                </h3>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition shrink-0 mt-1" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              The FY2025 disclaimer, the FY2028 goal, and the data platform that has to bridge them — 26 material weaknesses mapped to Advana capabilities, AI/ML remediation plays, and a 90-day to FY2028 execution roadmap.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border mb-3">
              <Stat value="26" label="Material weaknesses" />
              <Stat value="$859B" label="Unsupported adj." gold />
              <Stat value="FY28" label="Clean audit target" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['13 sections', 'Advana remediation', 'AI/ML plays', 'Roadmap'].map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
              ))}
            </div>
          </Link>

        </div>
      </section>

      {/* ── Hero ── */}
      <section className="container pb-10">
        <div className="rounded-lg border border-border bg-card/40 px-8 py-8 md:px-10 md:py-10 max-w-full">
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold mb-3">
            For federal financial management
          </p>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight leading-tight mb-4 max-w-3xl">
            An AI analyst for budget, audit, accounting, and contract work.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed mb-6 max-w-2xl">
            Upload PB justifications, audit reports, financial statements, and contract files.
            Get insider analysis and standard reporting from an agent that understands how federal programs actually work.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition">
              Open workspace <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/dashboard/chat" className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-accent transition">
              Ask the agent
            </Link>
          </div>
        </div>
      </section>

      {/* ── Practice areas ── */}
      <section className="container pb-12">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
          Practice areas
        </p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <AreaCard href="/dashboard/budget"     icon={BarChart3}     title="Budget & Programs"       copy="PB justifications, appropriation breakdowns, mandatory vs discretionary, program-level deltas." />
          <AreaCard href="/dashboard/audit"      icon={ShieldCheck}   title="Audit & Assurance"       copy="Findings tracker, CAP milestone status, repeat-finding detection, opinion readiness." />
          <AreaCard href="/dashboard/accounting" icon={Coins}         title="Accounting & Execution"  copy="Obligation rates, outlay tracking, ULO analysis, TAFS reconciliation, cancellation risk." />
          <AreaCard href="/dashboard/contracts"  icon={FileSignature} title="Contracts & Acquisition" copy="FAR/DFARS compliance, EVM variance, cost proposal review, competition analysis." />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-border bg-muted/20">
        <div className="container py-12">
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-8">How it works</p>
          <div className="grid gap-6 md:grid-cols-3">
            <Feature icon={Database} title="Knowledge base"
              copy="Documents are chunked and embedded into Neon pgvector. The agent retrieves the most relevant passages for every response — citations included." />
            <Feature icon={Bot} title="Multi-model waterfall"
              copy="Gemini 2.5 Flash Lite primary, with automatic failover to Groq Llama 3.3 70B, Llama 3.1 8B, and Gemini 2.0 Flash." />
            <Feature icon={FileCheck} title="Domain-native skills"
              copy="Six system prompts tuned for budget, audit, accounting, contracts, dashboards, and standard reports — GS-14/15-grade output." />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border">
        <div className="container py-6 text-xs text-muted-foreground flex flex-wrap gap-4 justify-between">
          <p>FedFMMatter — not affiliated with any federal agency. Do not upload classified or CUI material.</p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-foreground">About</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}

function Stat({ value, label, gold }: { value: string; label: string; gold?: boolean }) {
  return (
    <div>
      <div className={`text-base font-medium tracking-tight ${gold ? 'text-gold' : ''}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
    </div>
  )
}

function AreaCard({ href, icon: Icon, title, copy }: { href: string; icon: any; title: string; copy: string }) {
  return (
    <Link href={href} className="group rounded-lg border border-border bg-card p-4 transition hover:border-primary/60 hover:-translate-y-0.5">
      <Icon className="h-4 w-4 mb-2.5 text-muted-foreground group-hover:text-primary transition" />
      <h3 className="font-medium text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{copy}</p>
    </Link>
  )
}

function Feature({ icon: Icon, title, copy }: { icon: any; title: string; copy: string }) {
  return (
    <div>
      <Icon className="h-4 w-4 mb-2.5 text-gold" />
      <h3 className="font-medium text-sm mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{copy}</p>
    </div>
  )
}
