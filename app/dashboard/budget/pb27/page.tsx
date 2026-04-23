'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowUpRight, AlertTriangle, TrendingUp, TrendingDown,
  FileText, ShieldAlert, Info, ExternalLink, Download, Cpu, Rocket,
  Target, Globe2, Handshake, Factory,
} from 'lucide-react'
import {
  MandatoryBySection, DiscretionaryByTitle, ProcurementByAppropriation,
  MacMunitions, AiAutonomyBreakdown, LinesOfEffort,
} from '@/components/features/pb27/charts'
import { AdvanaDiagram } from '@/components/features/pb27/diagram'
import {
  TOPLINE, AI_AUTONOMY, WINNERS, LOSERS, RISKS, LOE,
} from '@/components/features/pb27/data'

const SECTIONS = [
  { id: 'overview',       label: 'Executive overview' },
  { id: 'framework',      label: 'Peace Through Strength' },
  { id: 'topline',        label: 'Topline architecture' },
  { id: 'discretionary',  label: 'Discretionary by title' },
  { id: 'mandatory',      label: 'Mandatory $350B' },
  { id: 'procurement',    label: 'Procurement deep-dive' },
  { id: 'munitions',      label: 'MAC munitions' },
  { id: 'ai',             label: 'AI, autonomy, Advana' },
  { id: 'winners-losers', label: 'Winners and losers' },
  { id: 'risks',          label: 'Execution risks' },
  { id: 'implications',   label: 'Portfolio implications' },
  { id: 'sources',        label: 'Sources' },
]

export default function PB27Page() {
  const [active, setActive] = useState('overview')

  // Highlight TOC entry as user scrolls
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
      {/* Sticky TOC */}
      <aside className="hidden lg:block w-56 flex-shrink-0 border-r border-border">
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
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition"
            >
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
              PB27 · Department of War · Inside Analysis
            </p>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight leading-tight mb-4">
              FY 2027 Department of War Budget — what the request actually says
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed mb-6 max-w-3xl">
              A portfolio-manager's reference to the FY27 President's Budget request. The documents use the rebranded "Department of War" nomenclature throughout (OUSW(C) rather than OUSD(C)), organized around the 2026 NDS "Peace Through Strength" framework and its four lines of effort. This page pulls out what matters for budget execution, force structure, and program-level planning.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>As of FY27 President's Budget submission</span>
              <span aria-hidden>·</span>
              <a href="https://comptroller.war.gov/Budget-Materials/Budget2027/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                OUSW(C) source materials <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </section>

        {/* Executive overview */}
        <Section id="overview" title="Executive overview">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Metric big={`$${TOPLINE.total.toLocaleString()}B`} label="Total request" sub={`Disc $${TOPLINE.discretionary}B + Mand $${TOPLINE.mandatory}B`} />
            <Metric big={`+${TOPLINE.scrubbedBaseGrowthPct}%`} label="Scrubbed base growth" sub={`$${TOPLINE.scrubbedBaseGrowthB}B above FY26 enacted (CRFB)`} />
            <Metric big={`${AI_AUTONOMY.dawgMultiplier}×`} label="DAWG year-over-year" sub={`$${AI_AUTONOMY.dawgFy26}B → $${AI_AUTONOMY.dawgFy27}B`} />
            <Metric big={`$${AI_AUTONOMY.sovereignInfra}B`} label="Sovereign AI infra" sub={`${AI_AUTONOMY.sovereignInfraShare}% of the $58.5B AI envelope`} />
          </div>

          <Callout tone="gold" title="The $1.45T headline obscures two different stories">
            The publicly reported 44% growth is inflated by adding the $350B in reconciliation-funded mandatory spending to the discretionary baseline. Scrubbed, the base defense discretionary increase is <strong className="text-foreground">$251B (28%) over FY26 enacted</strong> — still historically large, but not unprecedented. The remaining $350B flows through a reconciliation vehicle that <strong className="text-foreground">has not yet cleared Congress</strong>. A portfolio plan that depends on the mandatory tranche carries policy risk until that bill is signed.
          </Callout>

          <h3 className="font-medium text-base mt-8 mb-3">Five bottom-line takeaways</h3>
          <ol className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <li><span className="text-gold font-medium mr-2">01</span> Defense-Wide appropriations absorb <strong className="text-foreground">70% of the mandatory tranche ($245B)</strong>. OUSD(A&S) and CDAO are not sized to execute at this scale — expect heavy MIPR pass-through to the Services and significant Q4 carryover.</li>
            <li><span className="text-gold font-medium mr-2">02</span> Investment accounts (Procurement + RDT&E) exceed <strong className="text-foreground">50% of the request</strong> for the first time since the Reagan buildup.</li>
            <li><span className="text-gold font-medium mr-2">03</span> The AI portfolio is <strong className="text-foreground">infrastructure-heavy, not application-heavy</strong>. 79% is sovereign compute; 21% is applications, integration, and R&D. This inverts the commercial AI ratio.</li>
            <li><span className="text-gold font-medium mr-2">04</span> The MAC munitions package is the clearest signal of <strong className="text-foreground">real depletion</strong> from regional employment — PAC-3 MSE and THAAD alone get 2,009 missiles in one year.</li>
            <li><span className="text-gold font-medium mr-2">05</span> Attritable mass is an explicit doctrine now. <strong className="text-foreground">Drone Dominance at $53.6B</strong>, with a ~1:1 ratio of asset purchases to counter-UXS spending, suggests the Department expects defense to be economically dominant in the drone era.</li>
          </ol>
        </Section>

        {/* Peace Through Strength framework */}
        <Section id="framework" title="Peace Through Strength — four lines of effort">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            The 2026 National Defense Strategy reorganizes the Department around four mutually reinforcing lines of effort. Budget dollars map to these LoEs unevenly — Deter China and DIB are disproportionately funded, reflecting the strategic shift away from a globally distributed posture.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <LoeCard icon={Globe2} label="Homeland Defense" amount={LOE[0].amount} note="Golden Dome core, border, space domain awareness" />
            <LoeCard icon={Target} label="Deter China" amount={LOE[1].amount} note="INDOPACOM posture, munitions, AUKUS, Space Force" />
            <LoeCard icon={Handshake} label="Burden-Sharing" amount={LOE[2].amount} note="NATO 5% commitments, EDI reshape" />
            <LoeCard icon={Factory} label="Industrial Base" amount={LOE[3].amount} note="Munitions, shipbuilding, microelectronics, critical minerals" />
          </div>

          <ChartFrame title="FY27 resourcing by line of effort (illustrative $B)">
            <LinesOfEffort />
          </ChartFrame>
          <p className="text-xs text-muted-foreground mt-3">
            Note: LoE rollups are analyst-assembled from programmatic content, not a first-class appropriation view. Programs frequently support multiple LoEs.
          </p>
        </Section>

        {/* Topline */}
        <Section id="topline" title="Topline architecture — $1.45T built from two sources">
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                The request is architecturally bimodal. The discretionary $1.1T follows the traditional PPBE process — PB justification books, congressional markup, appropriations conference. The mandatory $350B depends on a reconciliation vehicle that bypasses the 60-vote Senate threshold but requires its own legislative path.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                The split is not just procedural. <strong className="text-foreground">Mandatory funding is baseline-counted</strong> — once authorized, it flows year over year without annual appropriation battles. For high-priority programs like Golden Dome, Drone Dominance, and the AI Arsenal, this is a strategic choice to protect the funding stream from future administrations.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                CRFB's analysis is worth internalizing: subtract the $350B reconciliation add, and the scrubbed base defense discretionary growth is $251B or 28% — historically large but not unprecedented.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <div className="text-xs text-muted-foreground mb-3">Decomposition</div>
              <div className="space-y-3 text-sm">
                <Row label="Total request" value="$1,450B" strong />
                <Row label="Discretionary (traditional PPBE)" value="$1,100B" />
                <Row label="Mandatory (via reconciliation)" value="$350B" />
                <div className="h-px bg-border my-2" />
                <Row label="FY26 enacted base" value="$900B" dim />
                <Row label="Scrubbed base growth" value="+$251B (+28%)" />
                <Row label="Mandatory add on top" value="+$350B" />
                <Row label="Nominal headline growth" value="+44%" dim />
              </div>
            </div>
          </div>
        </Section>

        {/* Discretionary by title */}
        <Section id="discretionary" title="Discretionary by appropriation title — where $1.1T sits">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            The discretionary $1.1T divides into the familiar appropriation titles. The notable shift for FY27 is the growth of <strong className="text-foreground">investment accounts</strong> (Procurement + RDT&E) relative to operating accounts (MILPERS + O&M). Investment accounts now exceed 50% of the total for the first time in decades.
          </p>
          <ChartFrame title="Discretionary $1.1T by appropriation title">
            <DiscretionaryByTitle />
          </ChartFrame>
          <div className="grid md:grid-cols-3 gap-3 mt-8">
            <SubCard title="O&M — $322B" body="$190B core readiness + enablers, plus $22B DHP/PSCP, $20B COMP (new appropriation), and base operations. The COMP carve-out is a structural change from prior-year DHP flow." />
            <SubCard title="MILPERS — $199B" body="Growth driven by the 7-6-5 pay raise (7% E-1 through E-4, 6% E-5 through O-6, 5% above), plus retention investments and expanded recruiting bonuses." />
            <SubCard title="RDT&E — $179B discretionary" body="Add another $100B in mandatory RDT&E,DW and the total RDT&E envelope is approaching $280B. The 6.1-6.3 science-and-technology line, however, is cut 8% — the imbalance is in applied development." />
          </div>
        </Section>

        {/* Mandatory */}
        <Section id="mandatory" title="Mandatory $350B — where the novel signal is">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            The mandatory tranche is where the strategic intent shows most clearly. Two sections — Defense Industrial Base and Next-Gen Tech & Autonomy — account for <strong className="text-foreground">61% ($216B) of the mandatory ask</strong>. Munitions takes another 13%. The remaining five sections split the final 26%.
          </p>
          <ChartFrame title="Mandatory $350B by section">
            <MandatoryBySection />
          </ChartFrame>
          <Callout tone="neutral" title="70% flows through Defense-Wide appropriations">
            Of the $350B mandatory, approximately $245B runs through Defense-Wide accounts: Procurement,DW ($39.4B), RDT&E,DW ($100.5B), DPA Purchases ($30.0B), Strategic Capital Credit ($20.0B), and a new Golden Dome for America Fund ($17.1B). That concentration in OSD-controlled accounts is <strong className="text-foreground">without recent historical precedent</strong>. Traditionally the Services would own this much new money.
          </Callout>
        </Section>

        {/* Procurement deep-dive */}
        <Section id="procurement" title="Procurement deep-dive — $413B in weapons buys">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            The combined procurement ask (discretionary + mandatory) is the most important chart if you track steel-and-silicon flows. Four anomalies stand out from the traditional pattern.
          </p>
          <ChartFrame title="Procurement by appropriation title, disc vs mand ($B)">
            <ProcurementByAppropriation />
          </ChartFrame>

          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <AnomalyCard
              title="Missile Procurement, Army — $36.6B"
              delta="$12.1B disc + $24.5B mand = 3.4× multiplier"
              body="Driven almost entirely by the MAC munitions acceleration. PAC-3 MSE quantities alone reach 1,636 missiles across Army and Navy — a ~3× step over the historical cadence of 500-650/year."
            />
            <AnomalyCard
              title="Aircraft Procurement, Army collapse"
              delta="$4.1B FY26 → $1.9B FY27"
              body="Zero Apache Block IIIA Reman funded, UH-60M drops from 29 → 1 aircraft, CH-47F from 11 → 5. This is the Army rotary-wing drawdown made explicit in budget dollars."
            />
            <AnomalyCard
              title="Shipbuilding, Navy — $65.8B"
              delta="Single largest procurement line in the budget"
              body="But DDG-51 drops to 1 hull/year from 2. Constellation-class frigate is cancelled outright — replaced by a new FF(X) program scheduled for PB28."
            />
            <AnomalyCard
              title="Space Force procurement doubled"
              delta="$10.1B → $19.1B"
              body="$7.7B of that is the new Space-based Air Moving Target Indicator (SB-AMTI) global coverage program, which did not exist as a FY26 line item. Proliferated LEO continues to grow."
            />
            <AnomalyCard
              title="DPA Purchases at $30.4B — 14× historical norm"
              delta="$2-3B typical → $30.4B FY27"
              body="This is effectively a new category of 'procurement' for the Department — buying industrial capacity rather than end items. Largely reflects critical minerals, microelectronics, and munitions substrate."
            />
            <AnomalyCard
              title="Office of Strategic Capital — $20.2B credit subsidy"
              delta="Backing ~$200B lending authority"
              body="OSC uses the credit-subsidy model to issue federal loan guarantees to industrial base suppliers. The $20B is the subsidy cost; the downstream lending is roughly 10× that."
            />
          </div>
        </Section>

        {/* Munitions */}
        <Section id="munitions" title="MAC munitions — 18 programs, $47B concentrated signal">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            The Munitions Acceleration Council package is the most concentrated procurement signal in the budget. It combines new-program funding with "FY26 Procurement Disconnects" — incremental money to accelerate prior-year contracts. The latter line alone is $19.6B, or 42% of the total MAC ask.
          </p>
          <ChartFrame title="MAC munitions ranked by mandatory dollars">
            <MacMunitions />
          </ChartFrame>

          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <Callout tone="coral" title="PAC-3 MSE — 1,636 missiles in one year">
              Army gets 1,429, Navy gets 207. Historical PAC-3 cadence is 500-650/year. This is a <strong className="text-foreground">~2.5-3× production step</strong> and will require Lockheed's Camden facility expansion to be online on schedule.
            </Callout>
            <Callout tone="coral" title="THAAD — 830 interceptors total">
              373 new plus 457 via the FY26 Disconnects acceleration. The replenishment profile reflects real depletion from regional employment — not a strategic reserve buildup.
            </Callout>
            <Callout tone="gold" title="Low-Cost Cruise Missile — the industrial-policy signal">
              $1.6B for 1,000 units at ~$300K unit cost, plus integration funding for 2,000 more. This is CCA-adjacent thinking applied to cruise missiles: <strong className="text-foreground">attritable mass over exquisite precision</strong>.
            </Callout>
            <Callout tone="gold" title="Blackbeard-GL hypersonic — $326M R&D">
              Small line, but the most strategically important development signal. Explicit attempt to drive hypersonic unit cost down by an order of magnitude from CPS/LRHW economics.
            </Callout>
          </div>

          <Callout tone="neutral" title="Conspicuous absence: SLCM-N zeroed">
            Sea-Launched Cruise Missile, Nuclear goes from $1.69B FY26 to $0 FY27. The stated justification is deterrence portfolio rationalization. The practical effect is to end a program that had substantial congressional support — expect markup activity.
          </Callout>
        </Section>

        {/* AI / autonomy */}
        <Section id="ai" title="AI, autonomy, and the Advana → War Data Platform transformation">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            This is where the budget is doing the most structurally novel work, and it's the section most likely to outlive any particular administration. The Department is simultaneously (a) building sovereign compute infrastructure, (b) restructuring its enterprise data platform, (c) standing up a dedicated autonomy organization with three-orders-of-magnitude budget growth, and (d) elevating a single CTO over the AI/innovation stack.
          </p>

          <div className="grid md:grid-cols-3 gap-3 mb-6">
            <Metric big={`$${AI_AUTONOMY.total}B`} label="Frontier-tech envelope" sub={`AI $${AI_AUTONOMY.aiEnvelope}B + Autonomy $${AI_AUTONOMY.autonomyEnvelope}B + S&T $${AI_AUTONOMY.stEnvelope}B`} />
            <Metric big={`${AI_AUTONOMY.sovereignInfraShare}%`} label="Infra share of AI envelope" sub={`$${AI_AUTONOMY.sovereignInfra}B of $${AI_AUTONOMY.aiEnvelope}B. Inverts commercial AI ratio.`} />
            <Metric big={`${AI_AUTONOMY.dawgMultiplier}×`} label="DAWG year-over-year growth" sub={`$${AI_AUTONOMY.dawgFy26}B FY26 → $${AI_AUTONOMY.dawgFy27}B FY27`} />
          </div>

          <ChartFrame title="AI Arsenal vs Drone Dominance breakdown">
            <AiAutonomyBreakdown />
          </ChartFrame>

          <h3 className="font-medium text-base mt-10 mb-4 flex items-center gap-2"><Cpu className="h-4 w-4 text-gold" /> Advana restructuring into the War Data Platform</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            Per the January 2026 Hegseth/Feinberg memos (which this budget is built to fund), Advana is being trifurcated. The technical problem is real: audit-quality data lineage and warfighting-latency data serving have incompatible requirements.
          </p>
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <AdvanaDiagram />
          </div>

          <h3 className="font-medium text-base mt-10 mb-4">What an ML/AI practitioner should notice</h3>
          <ol className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <li><strong className="text-foreground">Infrastructure-to-application ratio is inverted vs commercial.</strong> 79% of the AI envelope is infrastructure. A commercial AI build-out at comparable scale would typically be 40-50% infrastructure, 50-60% applications. The Department is betting the binding constraint is government-owned, hardened, air-gapped compute — not model quality.</li>
            <li><strong className="text-foreground">GenAI.mil is frontier-vendor-agnostic by design.</strong> Budget language says the Department will have "access to the latest models from the top American frontier AI labs." That's a model-plurality strategy — Anthropic, OpenAI, Google, xAI, Meta — with a thin integration layer rather than a single-vendor bet. The cancelled $15B AAMAC was the last major single-vendor-scale play.</li>
            <li><strong className="text-foreground">The WDP/Advana split is architecturally correct.</strong> Separating warfighting data serving (sub-second latency, agentic AI) from audit trails (reproducibility, lineage) is the right move. Expect WDP to look like a modern lakehouse + vector store + feature store + ML serving stack.</li>
            <li><strong className="text-foreground">The $46B sovereign infra has a hidden supply-chain dependency.</strong> $46B at 2026 prices implies 100Ks of H100/B200-class accelerators in government-owned facilities. The DIB section calls out $48.8B+ in critical-minerals/IBAS investment for the substrate and packaging. These two lines are coupled — watch CHIPS Act follow-on legislation.</li>
            <li><strong className="text-foreground">Drone Dominance is a bet on attritable mass.</strong> The ratio of Asset Purchases ($16.9B) to Counter-UXS ($14.4B) is ~1:1 — the Department is spending roughly as much defending against drones as buying them. That's diagnostic of a world where defense dominates offense economically. Target of 200K+ autonomous systems by 2027 at this budget implies average unit cost ~$85K — Group 2-3 small UAS, not exquisite MQ-9-class platforms.</li>
            <li><strong className="text-foreground">Agentic AI is the real frontier bet.</strong> The $500M "AI Pace Setting Projects" line is a bellwether. The seven PSPs are agentic workflows: AI-enabled cyber, AI-enabled intelligence reporting, AI-enabled manufacturing, AI-enabled maintenance. Tool use and automation, not generative content. This is where commercial AI is still immature.</li>
          </ol>
        </Section>

        {/* Winners and losers */}
        <Section id="winners-losers" title="Program winners and losers">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-medium mb-4">
                <TrendingUp className="h-4 w-4 text-green-500" /> Winners
              </h3>
              <div className="space-y-2">
                {WINNERS.map((w) => (
                  <div key={w.program} className="rounded-md border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="font-medium text-sm">{w.program}</div>
                      <div className="text-sm font-medium text-gold whitespace-nowrap">${w.amount}B</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{w.note}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-sm font-medium mb-4">
                <TrendingDown className="h-4 w-4 text-destructive" /> Cuts, terminations, drawdowns
              </h3>
              <div className="space-y-2">
                {LOSERS.map((l) => (
                  <div key={l.program} className="rounded-md border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="font-medium text-sm">{l.program}</div>
                      <div className="text-xs font-medium text-destructive whitespace-nowrap">{l.delta}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{l.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Risks */}
        <Section id="risks" title="Execution risks and congressional flags">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            The forward risk hierarchy is clear. Three items are at the high end — two legislative, one programmatic — and any of them can materially change the FY27 execution picture.
          </p>
          <div className="space-y-3">
            {RISKS.map((r) => (
              <RiskCard key={r.risk} severity={r.severity as any} risk={r.risk} detail={r.detail} />
            ))}
          </div>
        </Section>

        {/* Portfolio implications */}
        <Section id="implications" title="Portfolio management implications">
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-medium text-sm mb-2 flex items-center gap-2"><Rocket className="h-4 w-4 text-gold" /> Near-term (FY27 execution)</h3>
              <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                <li>• Expect heavy Q2-Q3 obligation activity in Defense-Wide mandatory accounts. Stand up MIPR infrastructure early.</li>
                <li>• Program plans that depend on reconciliation money must have a discretionary-only fallback path. Build both.</li>
                <li>• DAWG will not execute $53.6B in one fiscal year. Plan for 40-60% carryover and reprogramming actions into FY28.</li>
                <li>• Any program cut in PB27 should be treated as potentially restorable in conference. Monitor HASC and SASC markup.</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-medium text-sm mb-2 flex items-center gap-2"><Rocket className="h-4 w-4 text-gold" /> Mid-term (PB28 formulation)</h3>
              <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                <li>• BLI consolidation outcomes from this cycle determine the PB28 line-item structure. Track markup closely.</li>
                <li>• Advana for Financial Management moves from DWCF to agency appropriations in FY28 — plan for cost share reallocation.</li>
                <li>• Golden Dome architecture decisions made in FY27 will lock FY28-30 procurement profiles for SM-3 IIA, NGI, and sensor networks.</li>
                <li>• Sovereign AI infrastructure spending will create operational funding requirements (power, cooling, sustainment) that don't appear until FY29+.</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-medium text-sm mb-2 flex items-center gap-2"><Rocket className="h-4 w-4 text-gold" /> Long-term (2030+ force structure)</h3>
              <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                <li>• The DDG-51 to 1 hull/year decision, if sustained, changes the 2035 surface combatant force structure materially.</li>
                <li>• Army rotary-wing drawdown (UH-60, CH-47, AH-64 reman) is a structural bet on FLRAA and uncrewed teaming — the 2030 aviation mix looks different.</li>
                <li>• The DAWG scale-up creates an organizational dependency — if it fails to execute, the small-UAS mass strategy fails with it.</li>
                <li>• Warrior Ethos spending patterns (recruiting, retention, training) will determine whether the end-strength plan holds through 2028.</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Sources */}
        <Section id="sources" title="Sources and further reading">
          <div className="grid md:grid-cols-2 gap-3">
            <SourceLink href="https://comptroller.war.gov/Budget-Materials/Budget2027/" title="OUSW(C) FY2027 Budget Materials" note="Primary source — Overview Book, Mandatory Funding Overview, P-1/R-1" />
            <SourceLink href="https://www.crfb.org/" title="Committee for a Responsible Federal Budget" note="Scrubbed base defense discretionary growth analysis" />
            <SourceLink href="https://www.cbo.gov/" title="Congressional Budget Office" note="Baseline projections and reconciliation scoring" />
            <SourceLink href="https://www.gao.gov/" title="Government Accountability Office" note="GAO-26 series on acquisition, audit readiness, munitions industrial base" />
            <SourceLink href="https://crsreports.congress.gov/" title="Congressional Research Service" note="R-series and IF-series reports on specific programs" />
            <SourceLink href="https://www.whitehouse.gov/omb/" title="OMB Budget Materials" note="Cross-agency view, OMB Circular A-11 passback guidance" />
          </div>
          <p className="text-xs text-muted-foreground mt-6 leading-relaxed max-w-3xl">
            This analysis represents the author's reading of public PB27 materials and is not an official Department of War or agency product. Dollar figures round to one decimal place except where source material warrants greater precision. Where source material uses "Department of War" terminology, this page preserves it; where "DoD" is standard usage, both terms may appear.
          </p>
        </Section>

        <div className="border-t border-border py-8 px-6 md:px-10 text-xs text-muted-foreground">
          <Link href="/dashboard" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowUpRight className="h-3 w-3 rotate-[225deg]" /> Back to dashboard
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

function Row({ label, value, strong, dim }: { label: string; value: string; strong?: boolean; dim?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={dim ? 'text-muted-foreground' : ''}>{label}</span>
      <span className={`${strong ? 'font-medium' : ''} ${dim ? 'text-muted-foreground' : ''}`}>{value}</span>
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

function AnomalyCard({ title, delta, body }: { title: string; delta: string; body: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="font-medium text-sm mb-1">{title}</div>
      <div className="text-xs text-gold font-medium mb-2">{delta}</div>
      <div className="text-xs text-muted-foreground leading-relaxed">{body}</div>
    </div>
  )
}

function LoeCard({ icon: Icon, label, amount, note }: { icon: any; label: string; amount: number; note: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Icon className="h-4 w-4 text-gold mb-2" />
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Line of effort</div>
      <div className="font-medium text-sm mb-2">{label}</div>
      <div className="text-lg font-medium mb-2">~${amount}B</div>
      <div className="text-[11px] text-muted-foreground leading-snug">{note}</div>
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
  const Icon = tone === 'coral' ? AlertTriangle : tone === 'gold' ? Info : FileText
  return (
    <div className={`my-6 rounded-r-md border border-border ${borderClass} border-l-4 bg-card p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconClass}`} />
        <div>
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
