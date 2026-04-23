'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, MessageSquare, FileText,
  BarChart3, FolderOpen, FileStack,
  ShieldCheck, ClipboardCheck,
  Coins, Receipt,
  FileSignature, DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'

interface NavItem { href: string; icon: any; label: string }
interface NavGroup { label: string; items: NavItem[] }

const GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { href: '/dashboard',          icon: Home,         label: 'Overview' },
      { href: '/dashboard/chat',     icon: MessageSquare, label: 'Ask the agent' },
      { href: '/dashboard/reports',  icon: FileText,     label: 'Reports' },
    ],
  },
  {
    label: 'Budget & Programs',
    items: [
      { href: '/dashboard/budget',         icon: BarChart3,   label: 'Program analysis' },
      { href: '/dashboard/budget/pb27',    icon: FileStack,   label: 'PB27 inside' },
      { href: '/dashboard/budget/library', icon: FolderOpen,  label: 'Document library' },
    ],
  },
  {
    label: 'Audit & Assurance',
    items: [
      { href: '/dashboard/audit',         icon: ShieldCheck,     label: 'Findings tracker' },
      { href: '/dashboard/audit/inside',  icon: FileStack,       label: 'Audit inside' },
      { href: '/dashboard/audit/library', icon: FolderOpen,      label: 'Document library' },
    ],
  },
  {
    label: 'Accounting & Execution',
    items: [
      { href: '/dashboard/accounting',         icon: Coins,      label: 'Obligation analysis' },
      { href: '/dashboard/accounting/library', icon: FolderOpen, label: 'Document library' },
    ],
  },
  {
    label: 'Contracts & Acquisition',
    items: [
      { href: '/dashboard/contracts',         icon: FileSignature, label: 'Contract review' },
      { href: '/dashboard/contracts/library', icon: FolderOpen,    label: 'Document library' },
    ],
  },
]

export function DashboardNav() {
  const path = usePathname()
  return (
    <aside className="w-60 border-r border-border flex-shrink-0 flex flex-col bg-background">
      <div className="h-14 flex items-center justify-between px-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium tracking-tight">
          <span className="text-gold">◆</span>
          <span>FedFMMatter</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground px-2.5 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
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
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Do not upload classified or CUI material.
        </p>
      </div>
    </aside>
  )
}
