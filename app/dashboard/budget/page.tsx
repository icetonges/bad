import Link from 'next/link'
import { ArrowRight, BarChart3, FileStack, Target, FolderOpen, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function BudgetPage() {
  return (
    <div className="p-8 max-w-6xl w-full">
      <header className="mb-8">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold mb-2">Budget & Programs</p>
        <h1 className="text-2xl font-medium tracking-tight mb-1">Program analysis</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          PB justifications, OMB A-11 submissions, appropriation breakdowns, mandatory vs discretionary architecture, and program-level deltas. Upload documents to the library and the agent analyzes them with domain-native prompts.
        </p>
      </header>

      <section className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Featured analyses</p>
        <Link href="/dashboard/budget/pb27" className="group block">
          <Card className="transition hover:border-primary/60">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <FileStack className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-gold">Inside analysis</span>
                    <span className="text-[10px] text-muted-foreground">· Updated PB27 cycle</span>
                  </div>
                  <h3 className="font-medium text-base mb-1.5">FY 2027 Department of War Budget</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    A portfolio manager's reference: $1.45T topline, $350B mandatory tranche, procurement across 19 appropriation titles, MAC munitions, AI/autonomy portfolio, Advana → War Data Platform restructuring, winners and losers, execution risks.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>12 sections</span>
                    <span>·</span>
                    <span>8 interactive charts</span>
                    <span>·</span>
                    <span>6 execution-risk flags</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>

      <section className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Quick actions</p>
        <div className="grid gap-3 md:grid-cols-2">
          <QuickAction
            prompt="Produce an insider-quality budget analysis of my uploaded documents using the budget_analysis_insider skill. Cover topline, appropriation structure, major program deltas, force structure implications, reform claims, and execution risk."
            icon={Sparkles}
            title="Generate insider analysis"
            copy="Full portfolio-manager-grade analysis across topline, appropriations, programs, force structure, reform claims, and risk."
          />
          <QuickAction
            prompt="Compare the FY27 request to the FY26 enacted level in my uploaded documents. Focus on appropriation-title deltas and flag any program terminations or reversals."
            icon={BarChart3}
            title="Year-over-year comparison"
            copy="Scrub appropriation-title deltas and flag terminations, reversals, or structural changes."
          />
          <QuickAction
            prompt="Produce a detailed breakdown of mandatory vs discretionary funding by section and appropriation in my uploaded documents. Identify reconciliation dependencies."
            icon={Target}
            title="Mandatory vs discretionary"
            copy="Break down the ask by funding type and section. Flag reconciliation dependencies."
          />
          <QuickAction
            prompt="Produce a ranked list of top weapons procurement programs by dollars in my uploaded documents, with quantities and year-over-year change."
            icon={BarChart3}
            title="Top programs ranked"
            copy="Rank procurement programs by dollars, with unit quantities and YoY deltas."
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Document library</p>
          <Link href="/dashboard/budget/library" className="text-xs text-gold hover:text-primary transition inline-flex items-center gap-1">
            Open library <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <Link href="/dashboard/budget/library" className="block rounded-lg border border-dashed border-border bg-card p-6 text-center hover:border-primary/60 transition">
          <FolderOpen className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">Upload budget documents</p>
          <p className="text-xs text-muted-foreground">PB justification books, OMB submissions, appropriation bills, reprogramming requests.</p>
        </Link>
      </section>
    </div>
  )
}

function QuickAction({ prompt, icon: Icon, title, copy }: { prompt: string; icon: any; title: string; copy: string }) {
  return (
    <Link
      href={`/dashboard/chat?category=budget&prompt=${encodeURIComponent(prompt)}`}
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
