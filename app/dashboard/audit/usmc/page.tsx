'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowUpRight, AlertTriangle, ShieldAlert, Info, ExternalLink, Download,
  Sparkles, ShieldCheck,
} from 'lucide-react'
import { MWByNature, MWCarryForward, ScaleComparison } from '@/components/features/audit-usmc/charts'
import { USMCTimelineDiagram, EvidenceVsRemediationDiagram } from '@/components/features/audit-usmc/diagram'
import {
  USMC_TOPLINE, USMC_TIMELINE, USMC_MATERIAL_WEAKNESSES, USMC_NONCOMPLIANCE,
  USMC_WINS, DOD_RECOMMENDATIONS, USMC_INFORMED_RISKS, LIKELIHOOD_ASSESSMENT,
} from '@/components/features/audit-usmc/data'

const SECTIONS = [
  { id: 'overview',        label: 'Executive overview' },
  { id: 'timeline',        label: 'The timeline' },
  { id: 'paradox',         label: 'The central paradox' },
  { id: 'seven-mws',       label: 'The 7 material weaknesses' },
  { id: 'what-worked',     label: 'What USMC did right' },
  { id: 'noncompliance',   label: 'Noncompliance, unresolved' },
  { id: 'scale-reality',   label: 'The scaling reality' },
  { id: 'recommendations', label: 'DoD-wide recommendations' },
  { id: 'risk-assessment', label: 'Risk & likelihood' },
  { id: 'guidance-check',  label: 'Is current guidance realistic?' },
  { id: 'sources',         label: 'Sources' },
]

export default function USMCAuditSuccessPage() {
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
              Audit & Assurance · USMC Case Study
            </p>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight leading-tight mb-4">
              USMC's FY2025 audit success — what it actually proves, and what it doesn't
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed mb-6 max-w-3xl">
              The Marine Corps just did something no other Military Department has done: sustained a second consecutive unmodified audit opinion. But EY's FY2025 report also shows all seven FY2024 material weaknesses carried forward unchanged — zero new, zero resolved. That combination is the most important data point in this report. It means a clean opinion and a fully remediated control environment are two different achievements on two different timelines, and DoD's FY2028 planning needs to treat them that way.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>DODIG-2026-050 · Feb 6, 2026</span>
              <span aria-hidden>·</span>
              <span>FY 2025 USMC Agency Financial Report · Published Feb 9, 2026</span>
            </div>
          </div>
        </section>

        {/* 1. Executive overview */}
        <Section id="overview" title="Executive overview">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Metric big="2" label="Consecutive clean opinions" sub="FY2024 (first), FY2025 (sustained)" />
            <Metric big="7" label="Material weaknesses" sub="0 new · 0 resolved in FY25" />
            <Metric big="0" label="Significant deficiencies" sub="2 instances of noncompliance remain" />
            <Metric big="$52B" label="Total assets audited" sub={`$${USMC_TOPLINE.gppeNetB}B GPP&E, $${USMC_TOPLINE.totalAppropriationsB}B appropriations`} />
          </div>

          <Callout tone="gold" title="The headline most coverage will miss">
            An unmodified audit opinion is not a certification that internal controls are effective — it's a certification that the financial statements are fairly presented, in all material respects, based on sufficient audit evidence. USMC proves those can diverge for years at a time. Seven material weaknesses, zero significant deficiencies, two live instances of federal-law noncompliance (FFMIA, FMFIA) — and still, for the second year running, a clean opinion.
          </Callout>

          <h3 className="font-medium text-base mt-8 mb-3">Seven bottom-line takeaways</h3>
          <ol className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <li><span className="text-gold font-medium mr-2">01</span> <strong className="text-foreground">The FY2025 result is more informative than the FY2024 first.</strong> Any organization can get lucky once. Sustaining the opinion a second year, with the auditor citing the exact same seven weaknesses, is evidence the underlying audit-evidence discipline is real and repeatable — not a one-time push.</li>
            <li><span className="text-gold font-medium mr-2">02</span> <strong className="text-foreground">Zero material weaknesses were resolved.</strong> Table 1 of the AFR shows a beginning balance of 7, zero new, zero resolved, ending balance of 7. USMC did not out-fix its problems — it out-evidenced them.</li>
            <li><span className="text-gold font-medium mr-2">03</span> <strong className="text-foreground">The compensating-control strategy is explicit and load-bearing.</strong> $5.5B of Military Equipment and $3.0B of construction-in-progress are tracked in Excel workbooks, not systems of record — the auditor calls this out as inherent risk in the very same report that gives USMC a clean opinion.</li>
            <li><span className="text-gold font-medium mr-2">04</span> <strong className="text-foreground">Governance and interface ownership are the most portable wins.</strong> A Commandant-signed RMIC order, a standing Systems and Data Integration division, and a permanent DAI Interface Team with full visibility into all 27 incoming interfaces — these are staffing and process decisions, not multi-year IT programs.</li>
            <li><span className="text-gold font-medium mr-2">05</span> <strong className="text-foreground">USMC is the smallest of the four Military Department General Funds.</strong> Its $52B asset base is roughly one-seventh to one-eighth of Army's or Navy's. The pattern is proven at USMC's scale; it is not yet proven at Army/Navy/Air Force scale, and there's real reason to think it won't scale linearly.</li>
            <li><span className="text-gold font-medium mr-2">06</span> <strong className="text-foreground">One material weakness has an explicit downgrade estimate — for FY2028.</strong> Even USMC's own auditor doesn't expect Oversight and Monitoring to clear before the DoD's agency-wide target year. That's the fastest-moving of the seven.</li>
            <li><span className="text-gold font-medium mr-2">07</span> <strong className="text-foreground">DoD-level blockers (JSF Global Spares Pool, Building Partner Capacity) sit above all of this.</strong> No amount of Component-level replication of the USMC playbook touches them. They need independent executive ownership.</li>
          </ol>
        </Section>

        {/* 2. Timeline */}
        <Section id="timeline" title="The timeline — from disclaimer to sustained clean opinion">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            USMC spent years under the same disclaimer regime as every other Service before breaking through in FY2024. What makes FY2025 the more compelling data point is what <em>didn't</em> change underneath the opinion.
          </p>
          <div className="rounded-lg border border-border bg-card p-4 md:p-6 mb-8">
            <USMCTimelineDiagram />
          </div>
          <div className="space-y-3">
            {USMC_TIMELINE.map((t, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-4 flex items-start gap-4">
                <div className="flex-shrink-0 w-32 text-xs font-medium text-gold pt-0.5">{t.period}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm mb-1">{t.label}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{t.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 3. The paradox */}
        <Section id="paradox" title="The central paradox — and why it's actually good news">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            The instinct is to read "7 material weaknesses, 0 resolved, yet clean opinion" as a red flag — as if USMC talked its way past the auditor. That reading is wrong, and understanding why is the single most useful strategic insight in this entire report.
          </p>

          <div className="rounded-lg border border-border bg-card p-4 md:p-6 mb-6">
            <EvidenceVsRemediationDiagram />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Callout tone="gold" title="Why a clean opinion with open MWs is legitimate">
              A material weakness is a statement about <em>control design or operation</em> — the risk that a misstatement <em>could</em> occur and go undetected. An unmodified opinion is a statement about the <em>financial statements as presented</em>. USMC's manual workbooks, reconciliations, and compensating reviews are exactly the kind of detective controls that let an auditor conclude the numbers are right, even while agreeing the preventive control environment has gaps. GAO and FASAB standards explicitly allow for this distinction — it isn't a loophole, it's the design.
            </Callout>
            <Callout tone="coral" title="Why it's still a real risk, not a free pass">
              Compensating controls that rely on skilled people, tribal knowledge, and Excel do not scale, do not survive turnover well, and are themselves flagged as inherent risk by EY in the same report. USMC's opinion is durable only as long as the compensating-control discipline holds — and the auditor's own recommendations say the Department knows this and is trying to build out of it, not settling into it permanently.
            </Callout>
          </div>
        </Section>

        {/* 4. The 7 MWs */}
        <Section id="seven-mws" title="The 7 material weaknesses, analyzed">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            Reading the seven weaknesses side by side, they split cleanly into three natures — each with a different fix profile and a different realistic timeline. That split matters more than the raw count.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div>
              <ChartFrame title="7 material weaknesses by nature">
                <MWByNature />
              </ChartFrame>
            </div>
            <div>
              <ChartFrame title="FY25 carry-forward — the number that matters most">
                <MWCarryForward />
              </ChartFrame>
            </div>
          </div>

          <div className="space-y-4">
            {USMC_MATERIAL_WEAKNESSES.map((m) => (
              <div key={m.num} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-start gap-3 flex-wrap mb-3">
                  <span className="text-[11px] text-muted-foreground font-mono mt-0.5 flex-shrink-0">{String(m.num).padStart(2, '0')}</span>
                  <div className="flex-1 min-w-[240px]">
                    <div className="font-medium text-sm mb-0.5">{m.name}</div>
                    <span className={`inline-flex text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                      m.nature === 'Governance' ? 'text-[#5B4BC4] border-[#5B4BC4]/50' :
                      m.nature === 'Process/Manual' ? 'text-gold border-primary/60' :
                      'text-[#1E5AA8] border-[#1E5AA8]/50'
                    }`}>{m.nature}</span>
                    {m.dollarExposure && <span className="ml-2 text-[10px] text-muted-foreground">${m.dollarExposure}B tracked via manual workaround</span>}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-3"><span className="font-medium text-foreground/80">Root cause: </span>{m.rootCause}</p>

                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Key issues</div>
                    <ul className="space-y-1 text-xs text-muted-foreground leading-relaxed">
                      {m.keyIssues.map((k, j) => <li key={j} className="flex gap-1.5"><span className="text-muted-foreground/60">·</span><span>{k}</span></li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">EY recommendation</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{m.recommendation}</p>
                  </div>
                </div>

                <div className="rounded-md bg-accent/30 border border-border p-3 mb-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">FY25 status / corrective action</div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{m.fy25Status}</p>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed"><span className="font-medium text-foreground/80">Leverage assessment: </span>{m.leverage}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 5. What worked */}
        <Section id="what-worked" title="What USMC actually did right">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            None of these are exotic. That's the point — they're organizational discipline and staffing decisions that any Component could copy without waiting on a multi-year system replacement.
          </p>
          <div className="space-y-3">
            {USMC_WINS.map((w, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-4 flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm mb-1">{w.win}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{w.detail}</div>
                </div>
                {w.portable && (
                  <span className="flex-shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border text-green-600 border-green-600/40 whitespace-nowrap">Portable</span>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* 6. Noncompliance */}
        <Section id="noncompliance" title="Noncompliance that remains open, opinion notwithstanding">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            Two federal-law compliance findings sit alongside the clean opinion — a further reminder that "audit success" here is specifically about the financial statements, not a clean bill of health across every FM dimension.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {USMC_NONCOMPLIANCE.map((n, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="h-4 w-4 text-gold" />
                  <span className="font-medium text-sm">{n.law}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{n.detail}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 7. Scale reality */}
        <Section id="scale-reality" title="The scaling reality — why 'just copy USMC' undersells the problem">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            USMC General Fund carries roughly $52B in total assets against a $40.5B appropriation. Army, Navy, and Air Force General Funds each run several multiples larger. That difference isn't just bigger spreadsheets — it's materially more trading partners, interfaces, Service Providers, and legacy systems to reconcile.
          </p>

          <ChartFrame title="Total assets by entity — order-of-magnitude comparison">
            <ScaleComparison />
          </ChartFrame>
          <p className="text-xs text-muted-foreground mt-3 mb-8 max-w-3xl leading-relaxed">
            Army/Navy/Air Force figures shown are order-of-magnitude estimates for scale contrast, consistent with relative force-structure size — DODIG-2026-032 reports aggregate disclaimer coverage (≥43% of assets, ≥64% of budgetary resources across 11 entities) rather than entity-level asset totals.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <SubCard title="What scales linearly" body="Governance mechanics (a Commandant-equivalent-signed order, quarterly reporting cadence), and mechanically portable practices like a dedicated interface team and Error Handling Framework. These are staffing and policy choices — cost grows roughly with headcount, not with transaction volume." />
            <SubCard title="What doesn't scale linearly" body="Manual compensating controls (Excel-based GPP&E/OM&S tracking) that depend on a small number of experienced staff knowing exactly where the landmines are. At 7-10x the asset base, the same approach requires more than 7-10x the labor, because complexity (trading partners, Service Providers, legacy interfaces) grows faster than raw dollar value." />
          </div>
        </Section>

        {/* 8. Recommendations */}
        <Section id="recommendations" title="Recommendations for DoD as a whole">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            Eight recommendations, grouped by category and sequenced by priority horizon. These are derived directly from what USMC's FY2025 report shows worked, what it shows is still fragile, and where it shows the Component-level playbook simply doesn't reach.
          </p>
          <div className="space-y-3">
            {DOD_RECOMMENDATIONS.map((r, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start gap-3 flex-wrap mb-2">
                  <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-md bg-primary/10 text-gold text-xs font-semibold">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-foreground/80">{r.category}</span>
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                        r.priority.startsWith('Immediate') ? 'text-destructive border-destructive/60' :
                        r.priority.startsWith('6') ? 'text-gold border-primary/60' : 'text-muted-foreground border-border'
                      }`}>{r.priority}</span>
                    </div>
                    <div className="font-medium text-sm">{r.title}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-11">{r.detail}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 9. Risk assessment */}
        <Section id="risk-assessment" title="Risk assessment and likelihood of DoD-wide success">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            Reading the USMC result as evidence — not just precedent — changes the risk register for the FY2028 goal. Some risks get worse under scrutiny; one gets genuinely better.
          </p>
          <div className="space-y-3 mb-10">
            {USMC_INFORMED_RISKS.map((r, i) => (
              <RiskCard key={i} severity={r.severity as any} risk={r.risk} detail={r.detail} likelihood={r.likelihood} />
            ))}
          </div>

          <h3 className="text-base font-medium mb-4">Likelihood, by milestone</h3>
          <div className="space-y-3">
            {LIKELIHOOD_ASSESSMENT.map((l, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-4">
                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                  <span className="font-medium text-sm">{l.milestone}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                    l.likelihood.startsWith('Moderate') ? 'text-gold border-primary/60' :
                    l.likelihood.startsWith('Low') ? 'text-destructive border-destructive/60' :
                    'text-muted-foreground border-border'
                  }`}>{l.likelihood}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{l.rationale}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 10. Guidance check */}
        <Section id="guidance-check" title="Is DoD's current guidance and strategy realistic?">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            The Jan 2026 Feinberg memo and the USW(C)/CFO response letter (covered in the DoD FY2025 audit analysis) lay out a 90-day / 6-month / 12-month actionable roadmap and a two-milestone structure — FY2027 DWCF, FY2028 agency-wide. Held up against USMC's own experience, parts of that plan look well-calibrated and parts look optimistic.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Callout tone="gold" title="What looks well-calibrated">
              The FY2027 DWCF milestone as an interim step mirrors exactly what USMC did — pick a bounded perimeter, prove the pattern, then expand. The 45-day DepSec reporting cadence mirrors USMC's own quarterly-to-Commandant reporting requirement — sustained senior-leader attention is the single most consistent success factor across both. The emphasis on Seller Elimination Workbooks and Qlik-style interface analytics as DoD-wide plays is directly validated by USMC's experience — twice now.
            </Callout>
            <Callout tone="coral" title="What looks optimistic">
              The roadmap's 90-day and 6-month items (stand up control planes, triage adjustments, deploy agentic reconciliation) are plausible for governance and tooling stand-up — USMC did comparable things in a similar window. But the roadmap implicitly assumes Army/Navy/Air Force can compress USMC's multi-year, still-incomplete remediation curve into roughly 2-2.5 remaining years, at several times the scale, without a materially larger resourcing commitment than what's been disclosed.
            </Callout>
          </div>

          <h3 className="text-base font-medium mb-3">What should be done differently</h3>
          <div className="space-y-3">
            <OptionCard letter="A" title="Publish MW velocity, not just opinion status" body="Every Component's public FY26/FY27 status update should report beginning/new/resolved/ending material weakness counts — exactly like Table 1 of the USMC AFR. That single metric would have told stakeholders, a year early, that USMC's clean opinion wasn't accompanied by underlying fixes. The same transparency should apply DoD-wide before FY28 arrives, not after." />
            <OptionCard letter="B" title="Name a single 'next domino' Component now, not four in parallel" body="Diffusing remediation resources evenly across Army, Navy, and Air Force General Funds risks under-resourcing all three. Identify whichever remaining disclaimed entity is closest to USMC's scale and complexity and commit the concentrated governance/staffing model to it first — proving replication before assuming it." />
            <OptionCard letter="C" title="Split JSF GSP and BPC into an independently tracked workstream with named ownership" body="These DoD-level items don't respond to Component-level playbooks at all. They need their own executive sponsor, their own milestone tracking, and explicit acknowledgment that Component-level success — even DoD-wide — does not resolve them." />
          </div>
        </Section>

        {/* Sources */}
        <Section id="sources" title="Sources and further reading">
          <div className="grid md:grid-cols-2 gap-3">
            <SourceLink
              href="https://media.defense.gov/2026/Feb/09/2003873501/-1/-1/0/260209_FY2025_USMC_AFR.PDF"
              title="FY 2025 USMC Agency Financial Report (Feb 9, 2026)"
              note="Primary source for this page. Independent Auditor's Reports by Ernst & Young LLP (DODIG-2026-050), Feb 6, 2026 — 7 material weaknesses, 2 noncompliance instances, unmodified opinion."
            />
            <SourceLink
              href="/dashboard/audit/inside"
              title="DoD FY2025 Audit — Inside Analysis"
              note="The DoD-wide companion analysis: 26 material weaknesses, DODIG-2026-032, the Jan 2026 Feinberg memo, and the FY2028 roadmap this page assesses."
            />
            <SourceLink
              href="https://www.gao.gov/assets/gao-14-704g.pdf"
              title="GAO Green Book — Standards for Internal Control"
              note="Source of the 5 components / 17 principles framework underlying the Oversight and Monitoring material weakness."
            />
            <SourceLink
              href="https://fasab.gov/accounting-standards/"
              title="FASAB Handbook — SFFAS 3, 6, 48, 59"
              note="Accounting standards cited in the GPP&E, OM&S, and land-reporting sections of the USMC AFR."
            />
          </div>
          <p className="text-xs text-muted-foreground mt-6 leading-relaxed max-w-3xl">
            This analysis is an independent reading of the FY2025 USMC Agency Financial Report and its embedded Independent Auditor's Reports. Not an official DoW, USMC, or Advana program product. Figures for Army/Navy/Air Force scale comparison are order-of-magnitude estimates for contextual contrast only — see note under the scale comparison chart.
          </p>
        </Section>

        <div className="border-t border-border py-8 px-6 md:px-10 text-xs text-muted-foreground">
          <Link href="/dashboard/audit/inside" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowUpRight className="h-3 w-3 rotate-[225deg]" /> Back to DoD FY2025 Audit — Inside Analysis
          </Link>
        </div>
      </main>
    </div>
  )
}

// ---------- Sub-components (mirrors components/features/audit-inside/page pattern) ----------

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
  const Icon = tone === 'coral' ? AlertTriangle : tone === 'gold' ? Info : ShieldCheck
  return (
    <div className={`my-2 rounded-r-md border border-border ${borderClass} border-l-4 bg-card p-4`}>
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

function RiskCard({ severity, risk, detail, likelihood }: { severity: 'high' | 'medium' | 'low'; risk: string; detail: string; likelihood: string }) {
  const tone = severity === 'high' ? 'text-destructive border-destructive/60' :
               severity === 'medium' ? 'text-gold border-primary/60' :
               'text-green-600 border-green-600/40'
  return (
    <div className="rounded-md border border-border bg-card p-4 flex items-start gap-3">
      <ShieldAlert className={`h-4 w-4 mt-0.5 flex-shrink-0 ${severity === 'high' ? 'text-destructive' : severity === 'medium' ? 'text-gold' : 'text-green-600'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium text-sm">{risk}</span>
          <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${tone}`}>{severity}</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{likelihood}</span>
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">{detail}</div>
      </div>
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
  const isExternal = href.startsWith('http')
  const content = (
    <div className="rounded-md border border-border bg-card p-4 hover:border-primary/60 transition block group">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-medium text-sm">{title}</div>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-gold transition flex-shrink-0 mt-0.5" />
      </div>
      <div className="text-xs text-muted-foreground leading-relaxed">{note}</div>
    </div>
  )
  return isExternal ? (
    <a href={href} target="_blank" rel="noopener noreferrer">{content}</a>
  ) : (
    <Link href={href}>{content}</Link>
  )
}
