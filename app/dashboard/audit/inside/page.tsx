'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowUpRight, AlertTriangle, ShieldAlert, Info, ExternalLink, Download,
  Database, Cpu, Workflow, FileCheck, Target, GitBranch, CircleCheck, CircleAlert,
  Layers, Scale, Sparkles, Clock, CheckCircle2,
} from 'lucide-react'
import {
  MaterialWeaknessesByTheme, DollarAtRisk, DisclaimedEntitiesBreakdown,
  AdvanaTouchCoverage, DataPipelinePriorities,
} from '@/components/features/audit-inside/charts'
import {
  FY28RoadmapDiagram, AuditEvidenceFlowDiagram, AdvanaTrifurcationDiagram,
} from '@/components/features/audit-inside/diagram'
import {
  AUDIT_TOPLINE, DISCLAIMED_ENTITIES, MATERIAL_WEAKNESSES, SIGNIFICANT_DEFICIENCIES,
  NONCOMPLIANCE, ADVANA_CAPABILITIES, ACTIONABLE_90DAY, ACTIONABLE_6MONTH,
  ACTIONABLE_12MONTH, FY28_RISKS, AIML_PLAYS,
} from '@/components/features/audit-inside/data'

const SECTIONS = [
  { id: 'overview',          label: 'Executive overview' },
  { id: 'opinion',           label: 'The disclaimer explained' },
  { id: 'mw-architecture',   label: '26 MWs by theme' },
  { id: 'dollars',           label: 'Dollar-at-risk' },
  { id: 'fy28-roadmap',      label: 'Path to FY28' },
  { id: 'advana-role',       label: 'Advana as accelerator' },
  { id: 'trifurcation',      label: 'Advana → WDP restructure' },
  { id: 'evidence-flow',     label: 'Audit evidence flow' },
  { id: 'aiml',              label: 'AI/ML remediation plays' },
  { id: 'actionable',        label: 'Actionable roadmap' },
  { id: 'systems-tail',      label: 'Systems modernization' },
  { id: 'usmc-playbook',     label: 'USMC playbook' },
  { id: 'risks',             label: 'FY28 execution risks' },
  { id: 'sources',           label: 'Sources' },
]

export default function AuditInsidePage() {
  const [active, setActive] = useState('overview')

  useEffect(() => {
    const handler = () => {
      const positions = SECTIONS.map(s => {
        const el = document.getElementById(s.id)
        if (!el) return { id: s.id, top: Infinity }
        return { id: s.id, top: el.getBoundingClientRect().top }
      })
      const current = positions.filter(p => p.top < 140).sort((a, b) => b.top - a.top)[0]
      if (current) setActive(current.id)
    }
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="flex">
      {/* TOC */}
      <aside className="hidden lg:block w-60 flex-shrink-0 border-r border-border">
        <div className="sticky top-0 p-6">
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">Contents</p>
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`block text-xs py-1.5 px-2 rounded border-l-2 transition ${
                  active === s.id
                    ? 'border-primary text-foreground bg-accent/50'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {s.label}
              </a>
            ))}
          </nav>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">Export</p>
            <button onClick={() => window.print()} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition">
              <Download className="h-3.5 w-3.5" /> Print / save PDF
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        {/* Hero */}
        <section className="border-b border-border">
          <div className="max-w-4xl mx-auto px-6 md:px-10 py-12 md:py-16">
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold mb-3">
              Audit & Assurance · Inside Analysis
            </p>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight leading-tight mb-4">
              The FY2025 audit, the FY2028 goal, and the data platform that has to bridge them
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed mb-6 max-w-3xl">
              The DoD's 8th consecutive disclaimer of opinion was issued December 18, 2025 — 26 material weaknesses, 2 significant deficiencies, 5 instances of noncompliance. The CFO has committed to an unmodified opinion on the FY2028 agency-wide financial statements, with a FY2027 DWCF clean opinion as an interim milestone. This page is a portfolio manager's reference to how the disclaimer actually reads, where the dollar exposure sits, and — for anyone working inside Advana — how data, analytics, and agentic AI are the load-bearing mechanisms to close the gap.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>DODIG-2026-032 · Dec 18, 2025</span>
              <span aria-hidden>·</span>
              <a href="https://media.defense.gov/2026/Jan/12/2003855667/-1/-1/0/TRANSFORMING-ADVANA-TO-ACCELERATE-ARTIFICIAL-INTELLIGENCE-AND-ENHANCE-AUDITABILITY.PDF" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                Feinberg memo <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </section>

        {/* 1. Executive overview */}
        <Section id="overview" title="Executive overview">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Metric big="26" label="Material weaknesses" sub="+ 2 significant deficiencies, 5 noncompliance" />
            <Metric big={`${AUDIT_TOPLINE.assetCoverage}%`} label="Assets under disclaimer" sub={`${AUDIT_TOPLINE.budgetaryCoverage}% of budgetary resources (11 entities)`} />
            <Metric big="FY28" label="Clean audit target" sub="FY27 DWCF interim milestone" />
            <Metric big="5,665" label="Unsupported adjustments" sub={`$${AUDIT_TOPLINE.unsupportedAdjustmentsB}B — last 2 quarters FY25`} />
          </div>

          <Callout tone="coral" title="The disclaimer is structural, not incidental">
            Eleven DoD reporting entities — including all three Military Departments' General Funds, the Air Force WCF, TRANSCOM WCF, DIA, NGA, DHP, DISA, DLA WCF, and Army WCF — received <strong className="text-foreground">independent-auditor disclaimers of opinion</strong>. Combined, these cover ≥43% of assets and ≥64% of budgetary resources. Separately, the DoD-level disclaimer cites a confirmed <strong className="text-foreground">$18.9B Building Partner Capacity misstatement</strong> and an <strong className="text-foreground">unquantifiable misstatement on JSF Global Spares Pool assets</strong>. The Department cannot produce an unmodified opinion without addressing both the Component disclaimers and the DoD-level misstatements simultaneously.
          </Callout>

          <h3 className="font-medium text-base mt-8 mb-3">Six bottom-line takeaways</h3>
          <ol className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <li><span className="text-gold font-medium mr-2">01</span> The <strong className="text-foreground">FY2028 clean-audit goal is the binding constraint</strong> on nearly every FM modernization decision through 2028. Every legacy-system retirement schedule, every APSR consolidation, every trading-partner reconciliation tool is now scored against this deadline.</li>
            <li><span className="text-gold font-medium mr-2">02</span> Advana's <strong className="text-foreground">original purpose was audit</strong> — the platform was launched as the Universe of Transactions (UoT) to solve "which data sources account for this balance-sheet line." The January 2026 trifurcation is an explicit return to that original mission for the FinMgmt track.</li>
            <li><span className="text-gold font-medium mr-2">03</span> Of the 26 material weaknesses, <strong className="text-foreground">24 are data/IT problems dressed up as accounting problems</strong>. The accounting standards are known. The gap is in traceability, lineage, and reconciliation at transaction level.</li>
            <li><span className="text-gold font-medium mr-2">04</span> <strong className="text-foreground">USMC proved the pattern works.</strong> Using Advana's Seller Elimination Workbooks and Qlik obligation-interface analytics, the Marine Corps became the first military service to achieve a clean opinion. That playbook is directly portable to Army/Navy/AF.</li>
            <li><span className="text-gold font-medium mr-2">05</span> The FFMIA noncompliance tail is <strong className="text-foreground">25 years old</strong> (since FY2001) and some FMS systems aren't scheduled to retire until FY2031 — three years after the clean-audit target. This is the single largest structural risk to FY28.</li>
            <li><span className="text-gold font-medium mr-2">06</span> <strong className="text-foreground">Agentic AI is where the real leverage lives.</strong> Anomaly detection on the 5,665 unsupported adjustments, LLM-assisted CAP drafting, graph reconciliation for intragovernmental matches, natural-language retrieval of supporting documentation — these are the capabilities that compress the remediation timeline from decades to 24 months.</li>
          </ol>
        </Section>

        {/* 2. The disclaimer explained */}
        <Section id="opinion" title="The disclaimer, unpacked">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            A disclaimer of opinion is not "failed audit." The distinction matters. The DoD OIG was <strong className="text-foreground">unable to obtain sufficient appropriate audit evidence</strong> to form an opinion — meaning the statements might contain material misstatements that are both pervasive and undetected. That's different from adverse (opinion issued, material problems confirmed) or qualified (opinion issued, specific problems flagged).
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-base font-medium mb-3">Who received disclaimers</h3>
              <div className="rounded-md border border-border bg-card p-4 mb-4">
                <ChartFrame title="Disclaimed entities by branch (FY25)">
                  <DisclaimedEntitiesBreakdown />
                </ChartFrame>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {DISCLAIMED_ENTITIES.map(e => (
                  <li key={e.entity} className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">·</span>
                    <span className="flex-1">{e.entity}</span>
                    <span className="text-[10px] text-muted-foreground">{e.tier}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-base font-medium mb-3">What the OIG could not verify</h3>
              <Callout tone="coral" title={`Building Partner Capacity — $${AUDIT_TOPLINE.buildingPartnerMisstatementB}B confirmed misstatement`}>
                DoD recorded transferred funds as spent when they were moved to a trust fund account, rather than when goods/services were actually purchased for the partner nation. Rolls up into MW 26 (DoD-Wide Oversight).
              </Callout>
              <Callout tone="coral" title="JSF Global Spares Pool — unquantifiable">
                $2T life-cycle program. DoD cannot verify existence, completeness, or value of Global Spares Pool assets (spare parts, not aircraft). SFFAS 3 and 6 violations. This alone is sufficient to block an unmodified opinion regardless of other progress.
              </Callout>
              <Callout tone="neutral" title="Material weaknesses at Component level">
                Eleven independent audits returned disclaimers. The OIG uses those results plus agency-level procedures to form the overall opinion. The agency opinion <strong className="text-foreground">cannot clear</strong> while Component opinions are disclaimed.
              </Callout>
            </div>
          </div>

          <Callout tone="gold" title="USMC is the counter-example that makes FY28 feasible">
            The Marine Corps became the first Military Service to achieve a clean audit opinion. The remediation recipe — Advana Seller Elimination Workbooks, Qlik obligation-interface analytics, disciplined CAP execution — is documented, portable, and reproducible. The other services don't need to invent anything; they need to execute the USMC playbook at larger scale.
          </Callout>
        </Section>

        {/* 3. 26 MWs by theme */}
        <Section id="mw-architecture" title="The 26 material weaknesses, grouped by what it takes to fix them">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            Reading the 26 MWs sequentially is misleading. They cluster into six remediation themes, and the fix path is different for each cluster. The Systems/IT and Transactions clusters are where Advana has the most direct leverage.
          </p>

          <ChartFrame title="26 material weaknesses by remediation theme">
            <MaterialWeaknessesByTheme />
          </ChartFrame>

          <h3 className="text-base font-medium mt-10 mb-3">Advana touch coverage</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3 max-w-3xl">
            Of the 26 MWs, how many does the Advana platform — in its current or trifurcated form — <strong className="text-foreground">directly address</strong>?
          </p>
          <div className="rounded-md border border-border bg-card p-4">
            <AdvanaTouchCoverage />
          </div>
          <p className="text-xs text-muted-foreground mt-3 max-w-3xl leading-relaxed">
            "Core" means Advana was specifically built to solve this (UoT, unsupported adjustments, intragov). "Direct" means Advana is the intended primary remediation vehicle. "Indirect" means Advana supports remediation but isn't the primary lever — typically the IT/security weaknesses where the fix is NIST SP 800-53 control implementation in source systems.
          </p>

          <h3 className="text-base font-medium mt-10 mb-3">All 26 MWs, by theme</h3>
          <div className="space-y-4">
            {['Systems/IT', 'Asset Valuation', 'Liabilities/Tx', 'Revenue/Budget', 'Oversight', 'High-Value Programs'].map(theme => {
              const inTheme = MATERIAL_WEAKNESSES.filter(m => m.theme === theme)
              return (
                <div key={theme}>
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-gold mb-2">{theme} · {inTheme.length}</p>
                  <div className="grid md:grid-cols-2 gap-2">
                    {inTheme.map(m => (
                      <div key={m.num} className="rounded-md border border-border bg-card px-3 py-2 flex items-start gap-3">
                        <span className="text-[11px] text-muted-foreground font-mono mt-0.5 w-5 flex-shrink-0">{String(m.num).padStart(2, '0')}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{m.name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span className={`inline-flex h-1.5 w-1.5 rounded-full ${m.advanaTouch === 'Core' ? 'bg-blue-600' : m.advanaTouch === 'Direct' ? 'bg-gold' : 'bg-muted-foreground'}`} />
                            {m.advanaTouch === 'Core' ? 'Advana Core' : m.advanaTouch === 'Direct' ? 'Advana Direct' : 'Indirect'}
                            {m.dollarB && <span className="ml-auto text-muted-foreground">${m.dollarB < 1000 ? `${m.dollarB}B` : `${(m.dollarB / 1000).toFixed(1)}T`}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        {/* 4. Dollar at risk */}
        <Section id="dollars" title="Dollar-at-risk — the balances that can't be verified">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            When the OIG says the statements may contain material misstatements that are both material and pervasive, this is the scale we're talking about. The bars below show reported balances or confirmed misstatements where audit evidence was insufficient to verify. Log-scale X-axis for readability.
          </p>

          <ChartFrame title="Exposure by audit finding ($B, log scale)">
            <DollarAtRisk />
          </ChartFrame>

          <div className="grid md:grid-cols-3 gap-3 mt-8">
            <SubCard title="Confirmed misstatements" body={`$18.9B Building Partner Capacity + unquantifiable JSF Global Spares Pool. These are the two items the OIG specifically called out as material misstatements during audit procedures.`} />
            <SubCard title="Reported but unsupported" body="$859B in unsupported accounting adjustments (5,665+ in the last two quarters of FY25). $1.3B unreconciled variance between budgetary and proprietary in Note 24. These reported numbers lack audit evidence." />
            <SubCard title="Balance-sheet exposure" body="Fund Balance with Treasury (~$1T), Gross Costs ($1.5T), General PP&E ($501B), Real Property ($479B), Earned Revenue ($570B) — all carry material-weakness-level control deficiencies affecting support." />
          </div>
        </Section>

        {/* 5. FY28 roadmap */}
        <Section id="fy28-roadmap" title="The path to FY2028 — what the CFO actually committed to">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            In the USW(C)/CFO response letter appended to the DODIG report, Jules W. Hurst III committed to two sequential milestones: <strong className="text-foreground">FY2027 DWCF clean opinion</strong> (two-year cycle combined DWCF Financial Report), and <strong className="text-foreground">FY2028 agency-wide unmodified opinion</strong>. AI and automation are explicitly named as the delivery mechanism.
          </p>

          <ChartFrame title="FY2028 clean audit roadmap">
            <FY28RoadmapDiagram />
          </ChartFrame>

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div>
              <h3 className="font-medium text-base mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-gold" /> FY27 DWCF milestone</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                The Defense Working Capital Fund is where the CFO is betting the proof-case lives. Smaller perimeter than agency-wide, already some clean-opinion precedent (Navy DWCF under a 2-year cycle, USMC already clean), and heavily dependent on the types of reconciliation problems Advana is built for (buy/sell, inventory, rates).
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>· Combined DWCF Financial Report scope</li>
                <li>· 2-year audit cycle (FY26-FY27 consolidated)</li>
                <li>· Building block for FY28 agency-wide</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-base mb-3 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-gold" /> FY28 agency-wide goal</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                An unmodified (clean) opinion on the agency-wide financial statements. Every Component must resolve its own material weaknesses sufficiently that independent public accounting firms can issue unmodified opinions — and the DoD-level overlay (BPC, JSF GSP, DoD Oversight) must also clear.
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>· All 11 disclaimed entities must get to unmodified or qualified</li>
                <li>· JSF Global Spares Pool must be in accountable property system</li>
                <li>· Building Partner Capacity accounting must be corrected</li>
                <li>· FFMIA systems must be substantially compliant or retired</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* 6. Advana as accelerator */}
        <Section id="advana-role" title="Advana as the audit accelerator — why the platform matters">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            Working inside Advana means working at the core of the FY28 clean-audit mechanism. The platform was originally built for exactly this problem — the Universe of Transactions (UoT) concept came out of OUSD(C) in ~2018 to answer the specific auditor question: "which data sources account for this line on this balance sheet?" The January 2026 trifurcation is a deliberate re-focus of the FinMgmt track on that original mission.
          </p>

          <div className="grid md:grid-cols-3 gap-3 mb-8">
            <Metric big="~$1.3B" label="Advana spend to date" sub="Since 2019 inception" />
            <Metric big="100K+" label="Registered users" sub="Every service, COCOMs, OSD" />
            <Metric big="3,000+" label="Source systems mapped" sub="Data Catalog + Marketplace" />
          </div>

          <h3 className="font-medium text-base mt-6 mb-4">Capability → material weakness map</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            Ten Advana capabilities, mapped to specific material weaknesses they remediate. The USMC clean-opinion recipe is documented under the first two entries.
          </p>

          <div className="space-y-2.5">
            {ADVANA_CAPABILITIES.map((c, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-4">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="h-3.5 w-3.5 text-gold" />
                      <span className="font-medium text-sm">{c.capability}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{c.owner} · {c.aimlDepth}</div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Addresses</div>
                    <div className="flex flex-wrap gap-1">
                      {c.addresses.map((a, j) => (
                        <span key={j} className="text-[10px] bg-secondary text-foreground/80 px-1.5 py-0.5 rounded">{a}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[240px] text-xs text-muted-foreground leading-relaxed">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Proof / status</div>
                    {c.proof}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 7. Trifurcation */}
        <Section id="trifurcation" title="The Advana → WDP restructure — what changed in January 2026">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            Per the January 12, 2026 Hegseth/Feinberg memo (<em>"Transforming Advana to Accelerate Artificial Intelligence and Enhance Auditability"</em>), the legacy Advana program was trifurcated into three components. The FinMgmt track returns to the CFO's office — exactly where UoT started in 2018 before expanding to the "everything for everyone" scope that diluted audit focus.
          </p>

          <div className="rounded-lg border border-border bg-card p-4 md:p-6 mb-6">
            <AdvanaTrifurcationDiagram />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Callout tone="gold" title="Why this matters for audit">
              The FinMgmt track is now <strong className="text-foreground">owned by the Deputy CFO</strong> rather than CDAO, which aligns incentives. The Comptroller cares about the audit opinion in a way a central AI office doesn't. Expect aggressive focus on UoT completeness, FBWT reconciliation, and trading-partner matching.
            </Callout>
            <Callout tone="neutral" title="45-day DepSec reporting cadence">
              The memo requires the CDAO to provide the DepSec a status update every 45 days until both WDP and Advana FinMgmt reach Full Operational Capability. That's a standing forcing function to keep execution visible at the top.
            </Callout>
          </div>
        </Section>

        {/* 8. Evidence flow */}
        <Section id="evidence-flow" title="Audit evidence flow — source system to opinion">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            The path from a general-ledger transaction in a Service-level system to an auditor being able to form an unmodified opinion. Advana sits in the middle, with AI/ML capabilities doing the heavy lift between ingestion and auditable output.
          </p>

          <div className="rounded-lg border border-border bg-card p-4 md:p-6 mb-6">
            <AuditEvidenceFlowDiagram />
          </div>

          <h3 className="font-medium text-base mt-8 mb-3">Feinberg memo data pipeline priorities</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3 max-w-3xl">
            The memo specifically called out four data pipeline categories for the CDAO + Chief Data Officer + Deputy CFO to prioritize for "ingestion, consolidation, and quality assurance" in service of the FY27/FY28 audit goals:
          </p>
          <DataPipelinePriorities />
        </Section>

        {/* 9. AI/ML plays */}
        <Section id="aiml" title="AI/ML remediation plays — ten places where modeling moves the needle">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            This is the operating list. Each play maps a specific ML/AI technique to the material weakness it remediates, the Advana team that owns it, and the outcome. These are the 24-month capability bets that have to compound for FY28 to land.
          </p>

          <div className="space-y-3">
            {AIML_PLAYS.map((p, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-4">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-md bg-primary/10 text-gold text-xs font-semibold">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm mb-1">{p.play}</div>
                    <div className="grid md:grid-cols-3 gap-x-6 gap-y-1 text-xs text-muted-foreground">
                      <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Addresses</span><br />{p.mw}</div>
                      <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Technique</span><br />{p.technique}</div>
                      <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Owner</span><br />{p.where}</div>
                    </div>
                    <div className="text-xs text-foreground/80 leading-relaxed mt-2 pt-2 border-t border-border">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Outcome</span><br />
                      {p.outcome}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 10. Actionable roadmap */}
        <Section id="actionable" title="Actionable remediation roadmap">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            Items below are extracted from the Feinberg memo's explicit directives, the USW(C)/CFO response letter, and the 26 MW recommendations. Grouped by execution horizon. Each carries an owner and a source citation.
          </p>

          <div className="space-y-6">
            <HorizonBlock
              title="Next 90 days"
              icon={Clock}
              tone="destructive"
              items={ACTIONABLE_90DAY}
            />
            <HorizonBlock
              title="Next 6 months"
              icon={Workflow}
              tone="gold"
              items={ACTIONABLE_6MONTH}
            />
            <HorizonBlock
              title="Next 12 months (through FY27)"
              icon={Target}
              tone="neutral"
              items={ACTIONABLE_12MONTH}
            />
          </div>
        </Section>

        {/* 11. Systems modernization */}
        <Section id="systems-tail" title="The FFMIA tail — why systems modernization is the pacing item">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            The Federal Financial Management Improvement Act of 1996 has been non-compliant in DoD since FY2001. Twenty-five years. The DODIG report names <strong className="text-foreground">130+ financial management systems</strong> that are FFMIA-noncompliant today, with multiple general-ledger systems not scheduled to retire until FY2031 — three years after the FY28 clean-audit target.
          </p>

          <div className="grid md:grid-cols-3 gap-3 mb-6">
            <Metric big="130+" label="FFMIA-noncompliant systems" sub="Relevant to financial reporting" />
            <Metric big="25 yrs" label="Noncompliance tail" sub="Since FY2001 acknowledgment" />
            <Metric big="FY31" label="Latest retirement schedule" sub="Past the FY28 goal by 3 years" />
          </div>

          <Callout tone="coral" title="The timeline is mathematically incompatible">
            You cannot produce an unmodified audit opinion on financial statements while the underlying general-ledger systems feeding those statements are FFMIA-noncompliant. The stated DoD plan claims FY28 compliance, but published system-retirement schedules say FY31. One of these two plans has to change — either the retirement schedule gets aggressive, or the FY28 goal slips.
          </Callout>

          <h3 className="text-base font-medium mt-8 mb-3">Three structural options</h3>
          <div className="space-y-3">
            <OptionCard
              letter="A"
              title="Accelerate retirement"
              body="Compress the 2028-2031 retirement tail into 2026-2028. Requires aggressive modernization budgets, likely in the $10-15B range through FY28. This is the path the CFO response letter implies is being taken."
            />
            <OptionCard
              letter="B"
              title="Substantial-compliance workarounds"
              body="FFMIA allows 'substantial compliance' — argue that compensating controls (Advana lineage, transaction-level reconciliation) satisfy the intent even when the underlying system doesn't. Legally defensible but audit-risk-heavy."
            />
            <OptionCard
              letter="C"
              title="Scope reduction"
              body="Pursue FY28 clean opinion on a subset (DWCF, selected Components) and defer agency-wide to FY29 or FY30. The CFO response letter explicitly avoids this — FY28 agency-wide is the stated commitment."
            />
          </div>
        </Section>

        {/* 12. USMC playbook */}
        <Section id="usmc-playbook" title="The USMC playbook — what replicating clean-opinion actually looks like">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            The U.S. Marine Corps became the first Military Service to achieve a clean audit opinion. The recipe is publicly documented in Advana's own materials. It's worth studying because the remediation pattern is directly portable to the other services.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-medium text-base mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" /> Ingredients USMC used
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                <li>· <strong className="text-foreground">Advana Seller Elimination Workbooks</strong> — remediated the Intragovernmental Transactions material weakness (MW 19)</li>
                <li>· <strong className="text-foreground">Qlik obligation-interface capability</strong> — resolved obligation interface errors in the Marine Corps general ledger system (MW 6)</li>
                <li>· <strong className="text-foreground">Disciplined CAP execution</strong> — Corrective Action Plan milestones treated as first-class commander's priorities, not back-office work</li>
                <li>· <strong className="text-foreground">Navy leadership engineering support</strong> — called out by name in the Feinberg memo as having supported audit and Advana efforts</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-medium text-base mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-gold" /> What's directly portable
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                <li>· Seller Elimination Workbooks work for any Service General Fund / WCF buy-sell relationship</li>
                <li>· Qlik interface analytics work on any general ledger system feeding Advana</li>
                <li>· The CAP-execution discipline is organizational, not technical — copy the governance model</li>
                <li>· USMC is smaller than Army or Navy — the hard question is whether the pattern scales, not whether it works</li>
              </ul>
            </div>
          </div>

          <Callout tone="gold" title="The scaling question">
            Army General Fund is roughly 10× USMC's financial footprint. Navy General Fund is similar. If the USMC pattern scales linearly, Army/Navy remediation takes 3-5× longer than USMC's path. If it doesn't scale linearly — because bigger organizations have more trading partners, more interfaces, more legacy systems — the tail could be longer. <strong className="text-foreground">The Advana FinMgmt track's primary job in FY26-27 is figuring out how to scale USMC's pattern without proportional resource growth.</strong>
          </Callout>
        </Section>

        {/* 13. Risks */}
        <Section id="risks" title="FY2028 execution risks">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            The risk register for the FY28 plan. Three items are at the high end — and any one of them can materially change the arrival date.
          </p>
          <div className="space-y-3">
            {FY28_RISKS.map((r) => (
              <RiskCard key={r.risk} severity={r.severity as any} risk={r.risk} detail={r.detail} />
            ))}
          </div>

          <h3 className="text-base font-medium mt-10 mb-4">Significant deficiencies and noncompliance</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">2 significant deficiencies</p>
              <div className="space-y-2">
                {SIGNIFICANT_DEFICIENCIES.map((s, i) => (
                  <div key={i} className="rounded-md border border-border bg-card p-3">
                    <div className="font-medium text-sm mb-1">{s.name}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{s.detail}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">5 instances of noncompliance</p>
              <div className="space-y-2">
                {NONCOMPLIANCE.map((n, i) => (
                  <div key={i} className="rounded-md border border-border bg-card p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${n.severity === 'high' ? 'text-destructive border-destructive/60' : n.severity === 'medium' ? 'text-gold border-primary/60' : 'text-muted-foreground border-border'}`}>{n.severity}</span>
                      <span className="font-medium text-sm">{n.law}</span>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{n.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Sources */}
        <Section id="sources" title="Sources and further reading">
          <div className="grid md:grid-cols-2 gap-3">
            <SourceLink
              href="https://www.dodig.mil/reports.html/Article/4006554/independent-auditors-reports-on-the-dod-fy-2025-financial-statements-dodig-2026/"
              title="DODIG-2026-032 (Dec 18, 2025)"
              note="Primary source — Independent Auditor's Reports on DoD FY2025 Financial Statements. 26 MWs, 2 SDs, 5 noncompliance detailed here."
            />
            <SourceLink
              href="https://media.defense.gov/2026/Jan/12/2003855667/-1/-1/0/TRANSFORMING-ADVANA-TO-ACCELERATE-ARTIFICIAL-INTELLIGENCE-AND-ENHANCE-AUDITABILITY.PDF"
              title="Hegseth/Feinberg Advana memo (Jan 12, 2026)"
              note="Trifurcation directive. 45-day DepSec reporting cadence. Data pipeline priorities."
            />
            <SourceLink
              href="https://comptroller.defense.gov/"
              title="OUSW(C)/CFO — Office of the Comptroller"
              note="Agency Financial Report, FIAR Plan, DoD FMR — volume 6A ch 2, vol 4 ch 2 annex 1, vol 6B ch 7."
            />
            <SourceLink
              href="https://fasab.gov/accounting-standards/"
              title="FASAB Handbook — SFFAS 1, 3, 6, 7, 10, 48, 50, 54"
              note="Accounting standards cited throughout MWs. SFFAS 54 (leases) compliance specifically called out."
            />
            <SourceLink
              href="https://www.gao.gov/assets/gao-14-704g.pdf"
              title="GAO Green Book — Standards for Internal Control"
              note="Foundation for Component Entity-Level Controls MW (25) and Service Organizations MW (24)."
            />
            <SourceLink
              href="https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final"
              title="NIST SP 800-53 Rev 5"
              note="Configuration management, security management, access controls, SoD basis for MWs 2-5."
            />
          </div>
          <p className="text-xs text-muted-foreground mt-6 leading-relaxed max-w-3xl">
            This analysis is an independent reading of public source materials (DODIG-2026-032, the Jan 2026 Feinberg memo, USW(C)/CFO response letter, and publicly available Advana documentation). Not an official DoW or Advana program product. Where source materials use "Department of War" nomenclature (following the Trump administration renaming), this page preserves it; DoD is also used interchangeably where it represents the same organizational entity.
          </p>
        </Section>

        <div className="border-t border-border py-8 px-6 md:px-10 text-xs text-muted-foreground">
          <Link href="/dashboard/audit" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowUpRight className="h-3 w-3 rotate-[225deg]" /> Back to Audit & Assurance
          </Link>
        </div>
      </main>
    </div>
  )
}

// ---------- Sub-components ----------

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-b border-border scroll-mt-8">
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <h2 className="text-xl md:text-2xl font-medium tracking-tight mb-6">{title}</h2>
        {children}
      </div>
    </section>
  )
}

function Metric({ big, label, sub }: { big: string; label: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-medium tracking-tight mb-1">{big}</div>
      {sub && <div className="text-[11px] text-muted-foreground leading-snug">{sub}</div>}
    </div>
  )
}

function ChartFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <figure className="rounded-lg border border-border bg-card p-4 md:p-5">
      <figcaption className="text-xs text-muted-foreground mb-3 px-1">{title}</figcaption>
      {children}
    </figure>
  )
}

function SubCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="font-medium text-sm mb-1.5">{title}</div>
      <div className="text-xs text-muted-foreground leading-relaxed">{body}</div>
    </div>
  )
}

function Callout({ tone, title, children }: { tone: 'gold' | 'coral' | 'neutral'; title: string; children: React.ReactNode }) {
  const borderClass =
    tone === 'gold' ? 'border-l-primary' :
    tone === 'coral' ? 'border-l-destructive' :
    'border-l-border'
  const iconClass =
    tone === 'gold' ? 'text-gold' :
    tone === 'coral' ? 'text-destructive' :
    'text-muted-foreground'
  const Icon = tone === 'coral' ? AlertTriangle : tone === 'gold' ? Info : FileCheck
  return (
    <div className={`my-6 rounded-r-md border border-border ${borderClass} border-l-4 bg-card p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconClass}`} />
        <div className="min-w-0">
          <div className="font-medium text-sm mb-1">{title}</div>
          <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  )
}

function RiskCard({ severity, risk, detail }: { severity: 'high' | 'medium' | 'low'; risk: string; detail: string }) {
  const tone = severity === 'high' ? 'text-destructive border-destructive/60' :
               severity === 'medium' ? 'text-gold border-primary/60' :
               'text-muted-foreground border-border'
  return (
    <div className="rounded-md border border-border bg-card p-4 flex items-start gap-3">
      <ShieldAlert className={`h-4 w-4 mt-0.5 flex-shrink-0 ${severity === 'high' ? 'text-destructive' : severity === 'medium' ? 'text-gold' : 'text-muted-foreground'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium text-sm">{risk}</span>
          <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${tone}`}>{severity}</span>
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">{detail}</div>
      </div>
    </div>
  )
}

function HorizonBlock({ title, icon: Icon, tone, items }: { title: string; icon: any; tone: 'destructive' | 'gold' | 'neutral'; items: Array<{ action: string; owner: string; source: string }> }) {
  const toneClass = tone === 'destructive' ? 'text-destructive' : tone === 'gold' ? 'text-gold' : 'text-muted-foreground'
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="font-medium text-sm mb-4 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${toneClass}`} /> {title}
      </h3>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
            <span className={`text-[11px] font-mono mt-1 flex-shrink-0 w-6 ${toneClass}`}>{String(i + 1).padStart(2, '0')}</span>
            <div className="flex-1 min-w-0">
              <div className="text-foreground">{item.action}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                <span className="font-medium">Owner:</span> {item.owner} · <span className="font-medium">Source:</span> {item.source}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function OptionCard({ letter, title, body }: { letter: string; title: string; body: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4 flex items-start gap-4">
      <div className="flex-shrink-0 h-10 w-10 rounded-md bg-primary/10 text-gold flex items-center justify-center font-medium text-lg">
        {letter}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm mb-1">{title}</div>
        <div className="text-xs text-muted-foreground leading-relaxed">{body}</div>
      </div>
    </div>
  )
}

function SourceLink({ href, title, note }: { href: string; title: string; note: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-md border border-border bg-card p-4 hover:border-primary/60 transition block group">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-medium text-sm">{title}</div>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-gold transition flex-shrink-0 mt-0.5" />
      </div>
      <div className="text-xs text-muted-foreground leading-relaxed">{note}</div>
    </a>
  )
}
