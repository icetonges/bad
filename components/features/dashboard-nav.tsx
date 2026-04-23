'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileSpreadsheet, Gavel, Calculator, FileCheck, MessageSquare, FileText, Home, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'

const NAV = [
  { href: '/dashboard', icon: Home, label: 'Overview' },
  { href: '/dashboard/pb27', icon: BarChart3, label: 'PB27 Analysis' },
  { href: '/dashboard/budget', icon: FileSpreadsheet, label: 'Budget' },
  { href: '/dashboard/audit', icon: Gavel, label: 'Audit' },
  { href: '/dashboard/accounting', icon: Calculator, label: 'Accounting' },
  { href: '/dashboard/contracts', icon: FileCheck, label: 'Contracts' },
  { href: '/dashboard/chat', icon: MessageSquare, label: 'Agent' },
  { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
]

export function DashboardNav() {
  const path = usePathname()
  return (
    <aside className="w-56 border-r border-border flex-shrink-0 flex flex-col bg-background">
      <div className="h-14 flex items-center justify-between px-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium tracking-tight">
          <span className="text-gold">◆</span>
          <span>FedFMMatter</span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = path === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition',
                active
                  ? 'bg-secondary text-foreground border-l-2 border-primary pl-2'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Do not upload classified or CUI material.
        </p>
      </div>
    </aside>
  )
}
