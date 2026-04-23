import Link from 'next/link'
import { Mail, BarChart3, ShieldCheck, Coins, FileSignature, Bot, Database, FileCheck } from 'lucide-react'
import { ThemeToggle } from '@/components/features/theme-toggle'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-border">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-medium text-sm tracking-tight">
            <span className="text-gold">◆</span>
            <span>FedFMMatter</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition">Workspace</Link>
            <Link href="/dashboard/chat" className="text-muted-foreground hover:text-foreground transition">Ask</Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground transition">Contact</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <section className="container py-16 max-w-3xl">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold mb-3">About</p>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight leading-tight mb-4">Built for federal financial management.</h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
          FedFMMatter is an AI analyst platform for career federal professionals working on budget, audit, accounting, and contracts. It reads the documents you already work with and produces the analyses you already know how to write — faster, more consistently, and with source citations you can check.
        </p>

        <h2 className="text-xl font-medium tracking-tight mt-12 mb-4">What it does</h2>
        <div className="space-y-3 mb-8">
          <AboutRow icon={BarChart3} title="Budget & Programs" copy="PB justifications, appropriation breakdowns, mandatory vs discretionary architecture, program-level deltas. Includes a PB27 inside-analysis reference built by a senior budget practitioner." />
          <AboutRow icon={ShieldCheck} title="Audit & Assurance" copy="GAO/IG finding summaries, repeat-finding detection, CAP milestone tracking, unmodified-opinion readiness assessment." />
          <AboutRow icon={Coins} title="Accounting & Execution" copy="USSGL-aware obligation and outlay analysis, aging ULO surveillance, TAFS reconciliation, FFMIA compliance scanning." />
          <AboutRow icon={FileSignature} title="Contracts & Acquisition" copy="FAR/DFARS compliance scans, cost-proposal review, EVM variance analysis, competition-status review." />
        </div>

        <h2 className="text-xl font-medium tracking-tight mt-12 mb-4">How it works</h2>
        <div className="space-y-3 mb-8">
          <AboutRow icon={Database} title="Retrieval-grounded" copy="Your documents are chunked and embedded into a Neon pgvector knowledge base. When the agent answers, it cites the actual passages it pulled from." />
          <AboutRow icon={Bot} title="Multi-model waterfall" copy="Gemini 2.5 Flash Lite as primary with automatic failover to Groq Llama 3.3 70B, then Llama 3.1 8B, then Gemini 2.0 Flash. Free tier across all four." />
          <AboutRow icon={FileCheck} title="Domain-native skills" copy="Each practice area has a system prompt tuned so output reads like a senior career analyst wrote it — not a generic assistant. GS-14/15-grade output, not ChatGPT-grade." />
        </div>

        <h2 className="text-xl font-medium tracking-tight mt-12 mb-4">What it is not</h2>
        <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed mb-8">
          <li>• <strong className="text-foreground">Not an official federal product.</strong> This is an independent tool, not affiliated with any agency, department, or government entity.</li>
          <li>• <strong className="text-foreground">Not FedRAMP-authorized.</strong> Do not upload classified, CUI, or other controlled unclassified material without appropriate authorization.</li>
          <li>• <strong className="text-foreground">Not a replacement for your judgment.</strong> The agent produces analyses that sound authoritative. You are still responsible for verifying the output against source material before acting on it.</li>
        </ul>

        <div className="rounded-lg border border-border bg-card p-6 mt-12">
          <div className="flex items-start gap-4">
            <Mail className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-base mb-1">Get in touch</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Questions about the tool, feature requests, or agency-specific needs. I respond within two business days.
              </p>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition">
                Open contact form
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border mt-16">
        <div className="container py-8 text-xs text-muted-foreground flex flex-wrap gap-4 justify-between">
          <p>FedFMMatter — not affiliated with any federal agency.</p>
          <div className="flex gap-4">
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function AboutRow({ icon: Icon, title, copy }: { icon: any; title: string; copy: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-gold shrink-0 mt-1" />
      <div>
        <div className="font-medium text-sm mb-1">{title}</div>
        <div className="text-sm text-muted-foreground leading-relaxed">{copy}</div>
      </div>
    </div>
  )
}
