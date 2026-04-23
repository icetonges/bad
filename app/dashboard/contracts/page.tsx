import Link from 'next/link'
import { ArrowRight, FileSignature, DollarSign, Scale, Gavel, FolderOpen, TrendingUp, ListChecks } from 'lucide-react'

export default function ContractsPage() {
  return (
    <div className="p-8 max-w-6xl w-full">
      <header className="mb-8">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold mb-2">Contracts & Acquisition</p>
        <h1 className="text-2xl font-medium tracking-tight mb-1">Contract review</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Cost-proposal review, FAR/DFARS compliance scan, competition analysis, EVM variance calculation. The agent cites specific clauses by number and distinguishes between FFP, cost-reimbursable, and T&M implications.
        </p>
      </header>

      <section className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Portfolio snapshot</p>
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard icon={FileSignature} label="Active contracts" value="—" sub="In-scope review" />
          <MetricCard icon={DollarSign} label="Total obligated value" value="—" sub="Base + exercised options" />
          <MetricCard icon={TrendingUp} label="Cost variance flags" value="—" sub="Outside 10% threshold" warning />
          <MetricCard icon={Scale} label="Compliance issues" value="—" sub="FAR/DFARS concerns" warning />
        </div>
      </section>

      <section className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Quick actions</p>
        <div className="grid gap-3 md:grid-cols-2">
          <QuickAction
            prompt="Produce a contract summary for each uploaded contract: type (FFP/CPFF/T&M), period of performance, total value, option structure, small business designation."
            icon={ListChecks}
            title="Contract summary"
            copy="Type, period of performance, total value, option structure, small-business designation."
          />
          <QuickAction
            prompt="Review the cost proposals in my uploaded documents. Assess labor rate reasonableness, indirect rate structure, profit/fee, and flag FAR 15.4 / FAR 31 concerns."
            icon={DollarSign}
            title="Cost proposal review"
            copy="Labor-rate reasonableness, indirect structure, fee analysis, FAR 15.4 and 31 concerns."
          />
          <QuickAction
            prompt="Analyze competition status of my uploaded contracts. Full and open vs limited vs sole source. Review justifications under FAR 6.302."
            icon={Scale}
            title="Competition analysis"
            copy="Full and open vs limited vs sole source. FAR 6.302 justification review."
          />
          <QuickAction
            prompt="Calculate cost variance, schedule variance, ETC, and EAC from my uploaded EVM data. Flag breach thresholds."
            icon={TrendingUp}
            title="EVM variance"
            copy="CV, SV, ETC, EAC from EVM data. Threshold breach flags with trend analysis."
          />
          <QuickAction
            prompt="Scan my uploaded contracts for FAR and DFARS compliance issues. Reference specific clauses by number."
            icon={Gavel}
            title="FAR/DFARS compliance"
            copy="Full compliance scan with specific clause-number citations for each flag."
          />
          <QuickAction
            prompt="Review my uploaded contract files for cybersecurity compliance — CMMC level, DFARS 7012, SPRS scoring, and any subcontract flow-down gaps."
            icon={FileSignature}
            title="Cybersecurity compliance"
            copy="CMMC level, DFARS 7012, SPRS scoring, subcontract flow-down gaps."
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Document library</p>
          <Link href="/dashboard/contracts/library" className="text-xs text-gold hover:text-primary transition inline-flex items-center gap-1">
            Open library <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <Link href="/dashboard/contracts/library" className="block rounded-lg border border-dashed border-border bg-card p-6 text-center hover:border-primary/60 transition">
          <FolderOpen className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">Upload contract files</p>
          <p className="text-xs text-muted-foreground">Contract documents, cost proposals, modifications, EVM reports, subcontractor agreements, FAR/DFARS matrices.</p>
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
      href={`/dashboard/chat?category=contracts&prompt=${encodeURIComponent(prompt)}`}
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
