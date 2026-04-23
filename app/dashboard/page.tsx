import Link from 'next/link'
import { BarChart3, ShieldCheck, Coins, FileSignature, MessageSquare, FileText, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HealthBanner } from '@/components/features/health-banner'

export default function DashboardHome() {
  return (
    <div className="p-8 max-w-6xl w-full">
      <header className="mb-8">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold mb-2">Workspace</p>
        <h1 className="text-2xl font-medium tracking-tight mb-1">Overview</h1>
        <p className="text-sm text-muted-foreground">Pick a practice area to start — or go straight to the agent.</p>
      </header>

      <HealthBanner />

      <section className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Practice areas</p>
        <div className="grid gap-4 md:grid-cols-2">
          <AreaCard
            href="/dashboard/budget"
            icon={BarChart3}
            title="Budget & Programs"
            copy="Program analysis, PB justifications, appropriation breakdowns. Includes the PB27 inside analysis reference."
            featured="PB27 inside analysis available"
          />
          <AreaCard
            href="/dashboard/audit"
            icon={ShieldCheck}
            title="Audit & Assurance"
            copy="Findings tracker, repeat-finding detection, CAP milestones, opinion readiness."
          />
          <AreaCard
            href="/dashboard/accounting"
            icon={Coins}
            title="Accounting & Execution"
            copy="Obligation rates, outlay tracking, ULO aging, TAFS reconciliation."
          />
          <AreaCard
            href="/dashboard/contracts"
            icon={FileSignature}
            title="Contracts & Acquisition"
            copy="Contract cost review, FAR/DFARS compliance, EVM variance, performance."
          />
        </div>
      </section>

      <section>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Shortcuts</p>
        <div className="grid gap-4 md:grid-cols-2">
          <ShortcutCard href="/dashboard/chat" icon={MessageSquare} title="Ask the agent" copy="Open a chat session. The agent retrieves from your documents and cites source passages." />
          <ShortcutCard href="/dashboard/reports" icon={FileText} title="Reports" copy="Library of reports the agent has generated. Browse, reread, export." />
        </div>
      </section>
    </div>
  )
}

function AreaCard({ href, icon: Icon, title, copy, featured }: { href: string; icon: any; title: string; copy: string; featured?: string }) {
  return (
    <Link href={href}>
      <Card className="group h-full transition hover:border-primary/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle className="mb-2">{title}</CardTitle>
          <CardDescription className="leading-relaxed">{copy}</CardDescription>
          {featured && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-gold">
              <span className="h-1 w-1 rounded-full bg-gold" /> {featured}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

function ShortcutCard({ href, icon: Icon, title, copy }: { href: string; icon: any; title: string; copy: string }) {
  return (
    <Link href={href} className="rounded-lg border border-border bg-card p-4 flex items-start gap-3 transition hover:border-primary/60">
      <Icon className="h-4 w-4 mt-0.5 text-gold shrink-0" />
      <div>
        <div className="font-medium text-sm mb-0.5">{title}</div>
        <div className="text-xs text-muted-foreground leading-relaxed">{copy}</div>
      </div>
    </Link>
  )
}
