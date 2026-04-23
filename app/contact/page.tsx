import Link from 'next/link'
import { ContactForm } from '@/components/features/contact-form'
import { ThemeToggle } from '@/components/features/theme-toggle'

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-border">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-medium text-sm tracking-tight">
            <span className="text-gold">◆</span>
            <span>FedFMMatter</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>
      <section className="container py-16 max-w-2xl">
        <h1 className="text-2xl font-medium tracking-tight mb-2">Contact</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Questions, feature requests, or agency-specific needs. We respond within two business days.
        </p>
        <ContactForm />
      </section>
    </div>
  )
}
