'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileSpreadsheet, Gavel, Calculator, FileCheck, MessageSquare, FileText, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', icon: Home, label: 'Overview' },
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
    <aside className="w-56 border-r border-border flex-shrink-0 flex flex-col">
      <div className="h-14 flex items-center px-5 border-b border-border">
        <Link href="/" className="text-sm font-medium tracking-tight">fedAnalyst</Link>
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
                active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 text-xs text-muted-foreground border-t border-border">
        <p>Do not upload classified or CUI material.</p>
      </div>
    </aside>
  )
}
