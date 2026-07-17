'use client'

// ------------------------------------------------------------------
// USMC AUDIT TIMELINE — from disclaimer to sustained clean opinion
// ------------------------------------------------------------------
export function USMCTimelineDiagram() {
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 940 240" className="w-full min-w-[820px] text-foreground" role="img" aria-label="USMC audit opinion timeline from disclaimer to sustained clean opinion">
        <defs>
          <marker id="usmc-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1 L 8 5 L 2 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        <line x1="60" y1="120" x2="880" y2="120" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
        <line x1="880" y1="120" x2="880" y2="120" stroke="currentColor" strokeWidth="2" markerEnd="url(#usmc-arr)" />

        {/* FY17-23 disclaimers */}
        <circle cx="130" cy="120" r="14" fill="#C04B2D" stroke="hsl(var(--background))" strokeWidth="3" />
        <text x="130" y="125" textAnchor="middle" fontSize="11" fontWeight="600" fill="white">✕</text>
        <text x="130" y="80" textAnchor="middle" fontSize="13" fontWeight="500" fill="currentColor">FY2017–23</text>
        <text x="130" y="96" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">7 consecutive years</text>
        <text x="130" y="160" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">Disclaimers</text>
        <text x="130" y="176" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">Same as other Services</text>

        {/* FY24 first clean */}
        <circle cx="360" cy="120" r="16" fill="none" stroke="#4C9C6F" strokeWidth="3" />
        <text x="360" y="126" textAnchor="middle" fontSize="13" fontWeight="700" fill="#4C9C6F">✓</text>
        <text x="360" y="76" textAnchor="middle" fontSize="14" fontWeight="600" fill="currentColor">FY2024</text>
        <text x="360" y="94" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">First Military Service clean</text>
        <text x="360" y="160" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">Unmodified opinion</text>
        <text x="360" y="176" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">Seller Elim. Workbooks</text>
        <text x="360" y="190" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">+ Qlik interface analytics</text>

        {/* FY25 sustained */}
        <circle cx="600" cy="120" r="16" fill="#4C9C6F" stroke="hsl(var(--background))" strokeWidth="3" />
        <text x="600" y="126" textAnchor="middle" fontSize="13" fontWeight="700" fill="white">✓</text>
        <text x="600" y="76" textAnchor="middle" fontSize="14" fontWeight="600" fill="currentColor">FY2025</text>
        <text x="600" y="94" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Sustained — the harder proof</text>
        <text x="600" y="160" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">2nd consecutive clean</text>
        <text x="600" y="176" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#C04B2D">7 MWs: 0 new, 0 resolved</text>
        <text x="600" y="190" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">DODIG-2026-050</text>

        {/* FY26+ */}
        <circle cx="820" cy="120" r="14" fill="none" stroke="#D4AF37" strokeWidth="3" strokeDasharray="4,2" />
        <text x="820" y="76" textAnchor="middle" fontSize="13" fontWeight="500" fill="currentColor">FY2026+</text>
        <text x="820" y="94" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">RMIC maturing</text>
        <text x="820" y="160" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor">1st MW downgrade est.</text>
        <text x="820" y="176" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">Oversight & Monitoring → FY28</text>

        {/* connecting label */}
        <text x="470" y="215" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">Opinion achieved in year 1 · zero material weaknesses actually closed by year 2</text>
      </svg>
    </div>
  )
}

// ------------------------------------------------------------------
// EVIDENCE vs REMEDIATION — the core strategic reframe
// ------------------------------------------------------------------
export function EvidenceVsRemediationDiagram() {
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 880 300" className="w-full min-w-[720px] text-foreground" role="img" aria-label="Two separate tracks: audit evidence sufficiency versus material weakness remediation">
        <defs>
          <marker id="evr-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1 L 8 5 L 2 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        <text x="440" y="28" textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor">Two tracks that DoD's FY28 messaging currently conflates</text>

        {/* Track 1: Evidence sufficiency */}
        <g>
          <rect x="40" y="56" width="380" height="90" rx="8" fill="#4C9C6F" fillOpacity="0.1" stroke="#4C9C6F" strokeOpacity="0.7" strokeWidth="1.5" />
          <text x="230" y="82" textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor">Track 1 — Audit evidence sufficiency</text>
          <text x="230" y="102" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Can the auditor form an opinion that statements</text>
          <text x="230" y="116" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">are fairly presented — including via manual</text>
          <text x="230" y="130" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">compensating controls and workbooks?</text>

          <rect x="460" y="56" width="380" height="90" rx="8" fill="#C04B2D" fillOpacity="0.08" stroke="#C04B2D" strokeOpacity="0.6" strokeWidth="1.5" />
          <text x="650" y="82" textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor">Track 2 — Material weakness remediation</text>
          <text x="650" y="102" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Are the underlying control deficiencies actually</text>
          <text x="650" y="116" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">fixed — systems modernized, governance mature,</text>
          <text x="650" y="130" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">manual workarounds retired?</text>
        </g>

        <line x1="230" y1="146" x2="230" y2="190" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" markerEnd="url(#evr-arr)" />
        <line x1="650" y1="146" x2="650" y2="190" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" markerEnd="url(#evr-arr)" />

        <g>
          <rect x="40" y="192" width="380" height="50" rx="6" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
          <text x="230" y="214" textAnchor="middle" fontSize="12" fontWeight="600" fill="#4C9C6F">USMC: solved in 1 year (FY24)</text>
          <text x="230" y="230" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">Sustained a 2nd year (FY25)</text>

          <rect x="460" y="192" width="380" height="50" rx="6" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
          <text x="650" y="214" textAnchor="middle" fontSize="12" fontWeight="600" fill="#C04B2D">USMC: 0 of 7 MWs resolved in 2 years</text>
          <text x="650" y="230" textAnchor="middle" fontSize="10.5" fill="hsl(var(--muted-foreground))">1 of 7 has an FY28 downgrade estimate</text>
        </g>

        <text x="440" y="270" textAnchor="middle" fontSize="11.5" fontWeight="500" fill="currentColor">Implication for DoD-wide FY28 planning:</text>
        <text x="440" y="288" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">a clean agency-wide opinion is a plausible near-term goal — full remediation of all 26 MWs by FY28 is not the same goal, and is far less likely.</text>
      </svg>
    </div>
  )
}
