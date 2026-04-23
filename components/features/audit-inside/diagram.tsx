'use client'

// ------------------------------------------------------------------
// FY28 CLEAN AUDIT ROADMAP TIMELINE
// ------------------------------------------------------------------
export function FY28RoadmapDiagram() {
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 880 260" className="w-full min-w-[760px] text-foreground" role="img" aria-label="FY2028 clean audit roadmap timeline">
        <defs>
          <marker id="arr-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1 L 8 5 L 2 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {/* Backbone */}
        <line x1="60" y1="130" x2="820" y2="130" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
        <line x1="820" y1="130" x2="820" y2="130" stroke="currentColor" strokeWidth="2" markerEnd="url(#arr-r)" />

        {/* FY25 — done */}
        <circle cx="140" cy="130" r="14" fill="#C04B2D" stroke="hsl(var(--background))" strokeWidth="3" />
        <text x="140" y="135" textAnchor="middle" fontSize="11" fontWeight="600" fill="white">✕</text>
        <text x="140" y="90" textAnchor="middle" fontSize="13" fontWeight="500" fill="currentColor">FY25</text>
        <text x="140" y="106" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Dec 2025</text>
        <text x="140" y="170" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">Disclaimer</text>
        <text x="140" y="186" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">26 MWs · 2 SDs</text>
        <text x="140" y="200" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">8th consecutive</text>

        {/* FY26 — in progress */}
        <circle cx="340" cy="130" r="14" fill="#D4AF37" stroke="hsl(var(--background))" strokeWidth="3" />
        <text x="340" y="134" textAnchor="middle" fontSize="11" fontWeight="700" fill="#222">●</text>
        <text x="340" y="90" textAnchor="middle" fontSize="13" fontWeight="500" fill="currentColor">FY26</text>
        <text x="340" y="106" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">In progress</text>
        <text x="340" y="170" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">DWCF preparation</text>
        <text x="340" y="186" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">Advana FinMgmt stand-up</text>
        <text x="340" y="200" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">45-day DepSec reports</text>

        {/* FY27 — DWCF milestone */}
        <circle cx="540" cy="130" r="14" fill="none" stroke="#1E5AA8" strokeWidth="3" strokeDasharray="4,2" />
        <text x="540" y="90" textAnchor="middle" fontSize="13" fontWeight="500" fill="currentColor">FY27</text>
        <text x="540" y="106" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Q4 FY27</text>
        <text x="540" y="170" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">DWCF Clean Opinion</text>
        <text x="540" y="186" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">2-year cycle combined</text>
        <text x="540" y="200" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">Interim milestone</text>

        {/* FY28 — Agency-wide */}
        <circle cx="740" cy="130" r="16" fill="none" stroke="#4C9C6F" strokeWidth="3" />
        <text x="740" y="135" textAnchor="middle" fontSize="13" fontWeight="700" fill="#4C9C6F">✓</text>
        <text x="740" y="86" textAnchor="middle" fontSize="14" fontWeight="600" fill="currentColor">FY28</text>
        <text x="740" y="104" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Target</text>
        <text x="740" y="170" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">Agency-wide Clean</text>
        <text x="740" y="186" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">Unmodified opinion</text>
        <text x="740" y="200" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">USW(C)/CFO commitment</text>

        {/* Goal flag */}
        <rect x="778" y="44" width="60" height="28" rx="4" fill="#4C9C6F" fillOpacity="0.15" stroke="#4C9C6F" strokeOpacity="0.6" />
        <text x="808" y="62" textAnchor="middle" fontSize="11" fontWeight="600" fill="#4C9C6F">Goal</text>
      </svg>
    </div>
  )
}

// ------------------------------------------------------------------
// AUDIT EVIDENCE FLOW — source systems → Advana → auditor
// ------------------------------------------------------------------
export function AuditEvidenceFlowDiagram() {
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 920 480" className="w-full min-w-[760px] text-foreground" role="img" aria-label="Audit evidence flow from source systems through Advana to auditor">
        <defs>
          <marker id="evi-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1 L 8 5 L 2 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {/* Column headers */}
        <text x="100" y="30" textAnchor="middle" fontSize="11" fontWeight="600" fill="hsl(var(--muted-foreground))" letterSpacing="1">1 · SOURCE SYSTEMS</text>
        <text x="360" y="30" textAnchor="middle" fontSize="11" fontWeight="600" fill="hsl(var(--muted-foreground))" letterSpacing="1">2 · ADVANA LAYER</text>
        <text x="620" y="30" textAnchor="middle" fontSize="11" fontWeight="600" fill="hsl(var(--muted-foreground))" letterSpacing="1">3 · AI/ML PROCESSING</text>
        <text x="840" y="30" textAnchor="middle" fontSize="11" fontWeight="600" fill="hsl(var(--muted-foreground))" letterSpacing="1">4 · AUDITOR</text>

        {/* Column 1 — Source systems */}
        <g>
          <rect x="20" y="60" width="160" height="48" rx="6" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
          <text x="100" y="78" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">General Ledgers</text>
          <text x="100" y="94" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">130+ FMS, 400+ total</text>

          <rect x="20" y="120" width="160" height="48" rx="6" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
          <text x="100" y="138" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">APSRs</text>
          <text x="100" y="154" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">PP&E, Real Property, OM&S</text>

          <rect x="20" y="180" width="160" height="48" rx="6" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
          <text x="100" y="198" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">Contract Systems</text>
          <text x="100" y="214" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">FPDS, EDA, EVM</text>

          <rect x="20" y="240" width="160" height="48" rx="6" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
          <text x="100" y="258" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">Treasury Feeds</text>
          <text x="100" y="274" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">FBWT, G-Invoicing</text>

          <rect x="20" y="300" width="160" height="48" rx="6" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
          <text x="100" y="318" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">DFAS + Services</text>
          <text x="100" y="334" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">Trial balances, JVs</text>

          <rect x="20" y="360" width="160" height="48" rx="6" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
          <text x="100" y="378" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">Intragov Records</text>
          <text x="100" y="394" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">Trading partner data</text>
        </g>

        {/* Arrows to Advana */}
        {[84, 144, 204, 264, 324, 384].map((y, i) => (
          <line key={i} x1="180" y1={y} x2="280" y2="200" stroke="hsl(var(--muted-foreground))" strokeWidth="1" markerEnd="url(#evi-arr)" opacity="0.5" />
        ))}

        {/* Column 2 — Advana */}
        <g>
          <rect x="280" y="80" width="160" height="240" rx="8" fill="#1E5AA8" fillOpacity="0.1" stroke="#1E5AA8" strokeOpacity="0.7" strokeWidth="1.5" />
          <text x="360" y="108" textAnchor="middle" fontSize="14" fontWeight="600" fill="currentColor">Advana</text>
          <text x="360" y="126" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">for Financial Management</text>

          <rect x="294" y="144" width="132" height="32" rx="4" fill="hsl(var(--background))" stroke="hsl(var(--border))" />
          <text x="360" y="164" textAnchor="middle" fontSize="11" fill="currentColor">Data Catalog</text>

          <rect x="294" y="184" width="132" height="32" rx="4" fill="hsl(var(--background))" stroke="hsl(var(--border))" />
          <text x="360" y="204" textAnchor="middle" fontSize="11" fill="currentColor">Common Data Model</text>

          <rect x="294" y="224" width="132" height="32" rx="4" fill="hsl(var(--background))" stroke="hsl(var(--border))" />
          <text x="360" y="244" textAnchor="middle" fontSize="11" fill="currentColor">UoT Engine</text>

          <rect x="294" y="264" width="132" height="32" rx="4" fill="hsl(var(--background))" stroke="hsl(var(--border))" />
          <text x="360" y="284" textAnchor="middle" fontSize="11" fill="currentColor">Audit Workbooks</text>
        </g>

        {/* Arrows from Advana to AI */}
        <line x1="440" y1="200" x2="540" y2="200" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" markerEnd="url(#evi-arr)" />

        {/* Column 3 — AI/ML */}
        <g>
          <rect x="540" y="80" width="160" height="48" rx="6" fill="#5B4BC4" fillOpacity="0.12" stroke="#5B4BC4" strokeOpacity="0.6" />
          <text x="620" y="100" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">Anomaly Detection</text>
          <text x="620" y="116" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">JV outlier surfacing</text>

          <rect x="540" y="140" width="160" height="48" rx="6" fill="#5B4BC4" fillOpacity="0.12" stroke="#5B4BC4" strokeOpacity="0.6" />
          <text x="620" y="160" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">Graph Reconciliation</text>
          <text x="620" y="176" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">Trading partner match</text>

          <rect x="540" y="200" width="160" height="48" rx="6" fill="#5B4BC4" fillOpacity="0.12" stroke="#5B4BC4" strokeOpacity="0.6" />
          <text x="620" y="220" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">GenAI.mil RAG</text>
          <text x="620" y="236" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">Supporting doc search</text>

          <rect x="540" y="260" width="160" height="48" rx="6" fill="#5B4BC4" fillOpacity="0.12" stroke="#5B4BC4" strokeOpacity="0.6" />
          <text x="620" y="280" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">Agentic Workflows</text>
          <text x="620" y="296" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">SF-132/133 reconcile</text>

          <rect x="540" y="320" width="160" height="48" rx="6" fill="#5B4BC4" fillOpacity="0.12" stroke="#5B4BC4" strokeOpacity="0.6" />
          <text x="620" y="340" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">LLM CAP Drafting</text>
          <text x="620" y="356" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">Response generation</text>
        </g>

        {/* Arrows to auditor */}
        {[104, 164, 224, 284, 344].map((y, i) => (
          <line key={i} x1="700" y1={y} x2="780" y2="224" stroke="hsl(var(--muted-foreground))" strokeWidth="1" markerEnd="url(#evi-arr)" opacity="0.5" />
        ))}

        {/* Column 4 — Auditor */}
        <g>
          <rect x="780" y="180" width="120" height="88" rx="8" fill="#4C9C6F" fillOpacity="0.12" stroke="#4C9C6F" strokeOpacity="0.7" strokeWidth="1.5" />
          <text x="840" y="206" textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor">DoD OIG</text>
          <text x="840" y="224" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">+ IPA firms</text>
          <text x="840" y="244" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Lineage-backed</text>
          <text x="840" y="258" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">evidence</text>
        </g>

        {/* Legend at bottom */}
        <g>
          <rect x="20" y="432" width="880" height="36" rx="6" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeOpacity="0.5" />
          <text x="36" y="456" fontSize="11.5" fill="currentColor">
            <tspan fontWeight="500">Transformation goal:</tspan>
            <tspan fill="hsl(var(--muted-foreground))"> every audit assertion traceable from the Agency-Wide Financial Statements back to a specific source-system transaction via a single data platform lineage chain.</tspan>
          </text>
        </g>
      </svg>
    </div>
  )
}

// ------------------------------------------------------------------
// ADVANA TRIFURCATION — how the Jan 2026 Feinberg memo restructured
// ------------------------------------------------------------------
export function AdvanaTrifurcationDiagram() {
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 780 440" className="w-full min-w-[680px] text-foreground" role="img" aria-label="Advana trifurcation from Jan 2026 Feinberg memo">
        <defs>
          <marker id="trf-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1 L 8 5 L 2 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {/* Pre-state */}
        <g>
          <rect x="260" y="24" width="260" height="68" rx="8" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
          <text x="390" y="50" textAnchor="middle" fontSize="14" fontWeight="600" fill="currentColor">Legacy Advana (2019–2025)</text>
          <text x="390" y="70" textAnchor="middle" fontSize="11.5" fill="hsl(var(--muted-foreground))">$1.3B spent · 100K+ users · 55+ orgs</text>
          <text x="390" y="84" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Scope: "something for everyone"</text>
        </g>

        {/* Transition */}
        <text x="390" y="120" textAnchor="middle" fontSize="11.5" fill="#D4AF37" fontWeight="500">Jan 2026 Hegseth/Feinberg memo</text>

        <line x1="390" y1="128" x2="140" y2="180" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" markerEnd="url(#trf-arr)" />
        <line x1="390" y1="128" x2="390" y2="180" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" markerEnd="url(#trf-arr)" />
        <line x1="390" y1="128" x2="640" y2="180" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" markerEnd="url(#trf-arr)" />

        {/* Three new entities */}
        <g>
          <rect x="30" y="180" width="220" height="100" rx="8" fill="#1E5AA8" fillOpacity="0.1" stroke="#1E5AA8" strokeOpacity="0.7" strokeWidth="1.5" />
          <text x="140" y="206" textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor">War Data Platform</text>
          <text x="140" y="224" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Warfighting + intel</text>
          <text x="140" y="240" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Owner: USW(R&E) / CDAO</text>
          <text x="140" y="256" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Agentic AI data access</text>
          <text x="140" y="272" textAnchor="middle" fontSize="10.5" fontWeight="500" fill="#1E5AA8">Not audit-scoped</text>
        </g>

        <g>
          <rect x="280" y="180" width="220" height="100" rx="8" fill="#4C9C6F" fillOpacity="0.12" stroke="#4C9C6F" strokeOpacity="0.7" strokeWidth="1.8" />
          <text x="390" y="206" textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor">Advana for FinMgmt</text>
          <text x="390" y="224" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Audit + financial</text>
          <text x="390" y="240" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Owner: Comptroller / DCFO</text>
          <text x="390" y="256" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Returns to the CFO's office</text>
          <text x="390" y="272" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#4C9C6F">← audit path lives here</text>
        </g>

        <g>
          <rect x="530" y="180" width="220" height="100" rx="8" fill="#5B4BC4" fillOpacity="0.1" stroke="#5B4BC4" strokeOpacity="0.7" strokeWidth="1.5" />
          <text x="640" y="206" textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor">WDP App Services</text>
          <text x="640" y="224" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">App rationalization</text>
          <text x="640" y="240" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Owner: USW(R&E)</text>
          <text x="640" y="256" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Self-service AI tooling</text>
          <text x="640" y="272" textAnchor="middle" fontSize="10.5" fontWeight="500" fill="#5B4BC4">GenAI.mil surface</text>
        </g>

        {/* FY28 output */}
        <line x1="390" y1="280" x2="390" y2="340" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" markerEnd="url(#trf-arr)" />
        <g>
          <rect x="180" y="340" width="420" height="70" rx="8" fill="#D4AF37" fillOpacity="0.12" stroke="#D4AF37" strokeOpacity="0.7" strokeWidth="1.8" />
          <text x="390" y="365" textAnchor="middle" fontSize="14" fontWeight="600" fill="currentColor">FY28 agency-wide unmodified audit opinion</text>
          <text x="390" y="386" textAnchor="middle" fontSize="11.5" fill="hsl(var(--muted-foreground))">USW(C)/CFO commitment — interim FY27 DWCF clean milestone</text>
          <text x="390" y="402" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">CDAO provides DepSec status every 45 days until Advana FinMgmt reaches FOC</text>
        </g>
      </svg>
    </div>
  )
}
