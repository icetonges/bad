import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileSpreadsheet, Gavel, Calculator, FileCheck, ArrowRight } from 'lucide-react'

const CATEGORIES = [
  { href: '/dashboard/budget', icon: FileSpreadsheet, title: 'Budget', copy: 'PB justifications, OMB submissions, appropriation analyses' },
  { href: '/dashboard/audit', icon: Gavel, title: 'Audit', copy: 'GAO reports, IG findings, OMB A-123 work' },
  { href: '/dashboard/accounting', icon: Calculator, title: 'Accounting', copy: 'Financial statements, obligation reports, cost analyses' },
  { href: '/dashboard/contracts', icon: FileCheck, title: 'Contracts', copy: 'Contract files, cost proposals, performance data' },
]

export default function DashboardHome() {
  return (
    <div className="p-8 max-w-6xl w-full">
      <header className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight mb-1">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Pick a category to start — or go straight to the agent.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 mb-8">
        {CATEGORIES.map((c) => {
          const Icon = c.icon
          return (
            <Link key={c.href} href={c.href}>
              <Card className="group transition hover:border-foreground/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="mb-1">{c.title}</CardTitle>
                  <CardDescription>{c.copy}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent documents</CardTitle>
            <CardDescription>Will populate after your first upload.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No documents yet.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent reports</CardTitle>
            <CardDescription>Generated via the agent.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No reports yet.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
