import { DashboardNav } from '@/components/features/dashboard-nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
