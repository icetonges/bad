import Link from 'next/link'
import { ArrowRight, ShieldCheck, ClipboardCheck, AlertTriangle, RefreshCw, FolderOpen, FileCheck, FileStack } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function AuditPage() {
  return (
    <div className="p-8 max-w-6xl w-full">
      <header className="mb-8">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold mb-2">Audit & Assurance</p>
        <h1 className="text-2xl font-medium tracking-tight mb-1">Findings tracker</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Track GAO and IG findings, OMB Circular A-123 work, FMFIA and FFMIA reporting. The agent separates material weaknesses from significant deficiencies, flags repeat findings, and evaluates CAP milestone progress.
        </p>
      </header>

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
                    A portfolio manager's reference to the 8th consecutive disclaimer: 26 material weaknesses, $1T+ in exposed balances, FY28 agency-wide commitment, and how Advana's data platform, UoT engine, and agentic AI close the gap. Heavy emphasis on data-driven remediation.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>14 sections</span>
                    <span>·</span>
                    <span>10 AI/ML remediation plays</span>
                    <span>·</span>
                    <span>USMC playbook</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>

      <section className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Pulse</p>
        <div className="grid gap-3 md:grid-cols-4">
          <PulseCard icon={AlertTriangle} label="Open findings" value="—" sub="Upload reports to populate" tone="destructive" />
          <PulseCard icon={RefreshCw} label="Repeat findings" value="—" sub="Recurring from prior year" tone="warning" />
          <PulseCard icon={ClipboardCheck} label="CAPs on track" value="—" sub="On-schedule corrective actions" tone="ok" />
          <PulseCard icon={FileCheck} label="Opinion readiness" value="—" sub="Agent-assessed score" tone="neutral" />
        </div>
      </section>

      <section className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Quick actions</p>
        <div className="grid gap-3 md:grid-cols-2">
          <QuickAction
            prompt="Summarize all findings and recommendations in my uploaded audit documents. Separate material weaknesses from significant deficiencies. Flag repeat findings."
            icon={ShieldCheck}
            title="Summarize findings"
            copy="All findings, separated by material weakness / significant deficiency, with repeat-finding flags."
          />
          <QuickAction
            prompt="Build a Corrective Action Plan status table from my uploaded documents. Show open vs closed, due dates, and owners."
            icon={ClipboardCheck}
            title="CAP status table"
            copy="Open vs closed corrective actions, milestone dates, assigned owners."
          />
          <QuickAction
            prompt="Assess the likelihood of achieving an improved audit opinion in the next cycle based on findings in my uploaded documents. Reference FMFIA, FFMIA, A-123 where applicable."
            icon={FileCheck}
            title="Opinion readiness assessment"
            copy="Likelihood scoring for next-cycle opinion improvement, referencing FMFIA/FFMIA/A-123."
          />
          <QuickAction
            prompt="Compare findings in my uploaded audit reports across years. Identify trend patterns and recurring issues."
            icon={RefreshCw}
            title="Year-over-year trend"
            copy="Multi-year finding comparison with trend patterns and recurrence analysis."
          />
        </div>
      </section>

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
          <p className="text-xs text-muted-foreground">GAO reports, IG findings, OMB A-123 workpapers, management responses, CAP tracking sheets.</p>
        </Link>
      </section>
    </div>
  )
}

function PulseCard({ icon: Icon, label, value, sub, tone }: { icon: any; label: string; value: string; sub: string; tone: 'destructive' | 'warning' | 'ok' | 'neutral' }) {
  const toneClass =
    tone === 'destructive' ? 'text-destructive' :
    tone === 'warning' ? 'text-gold' :
    tone === 'ok' ? 'text-green-600' :
    'text-muted-foreground'
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <Icon className={`h-3.5 w-3.5 ${toneClass}`} />
      </div>
      <div className="text-2xl font-medium tracking-tight mb-1">{value}</div>
      <div className="text-[11px] text-muted-foreground leading-tight">{sub}</div>
    </div>
  )
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
