'use client'

export function AdvanaDiagram() {
  // Uses `currentColor` for strokes and theme-aware classes on fills
  // so the diagram works in both light and dark modes.
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 720 480" className="w-full min-w-[640px] text-foreground" role="img" aria-label="Advana restructuring into War Data Platform, Advana for Financial Management, and WDP Application Services">
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1 L 8 5 L 2 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {/* Legacy Advana */}
        <g>
          <rect x="260" y="20" width="200" height="58" rx="8" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
          <text x="360" y="42" textAnchor="middle" fontSize="13" fontWeight="500" fill="currentColor">Advana (legacy)</text>
          <text x="360" y="60" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Since 2019 · 400+ systems</text>
        </g>

        {/* Arrows to three children */}
        <line x1="360" y1="80" x2="140" y2="130" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" markerEnd="url(#arr)" />
        <line x1="360" y1="80" x2="360" y2="130" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" markerEnd="url(#arr)" />
        <line x1="360" y1="80" x2="580" y2="130" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" markerEnd="url(#arr)" />

        {/* Three heirs */}
        <g>
          <rect x="40" y="130" width="200" height="78" rx="8" fill="#1E5AA8" fillOpacity="0.1" stroke="#1E5AA8" strokeOpacity="0.7" />
          <text x="140" y="154" textAnchor="middle" fontSize="13" fontWeight="500" fill="currentColor">War Data Platform</text>
          <text x="140" y="174" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Warfighting / intel data</text>
          <text x="140" y="192" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Standardized AI data access</text>
        </g>
        <g>
          <rect x="260" y="130" width="200" height="78" rx="8" fill="#1D9E75" fillOpacity="0.1" stroke="#1D9E75" strokeOpacity="0.7" />
          <text x="360" y="154" textAnchor="middle" fontSize="13" fontWeight="500" fill="currentColor">Advana for Fin Mgmt</text>
          <text x="360" y="174" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Audit remediation</text>
          <text x="360" y="192" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">FY27 DWCF → FY28 agency</text>
        </g>
        <g>
          <rect x="480" y="130" width="200" height="78" rx="8" fill="#5B4BC4" fillOpacity="0.1" stroke="#5B4BC4" strokeOpacity="0.7" />
          <text x="580" y="154" textAnchor="middle" fontSize="13" fontWeight="500" fill="currentColor">WDP App Services</text>
          <text x="580" y="174" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">App rationalization</text>
          <text x="580" y="192" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Self-service AI tooling</text>
        </g>

        {/* Arrows to outputs */}
        <line x1="140" y1="208" x2="140" y2="260" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" markerEnd="url(#arr)" />
        <line x1="360" y1="208" x2="360" y2="260" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" markerEnd="url(#arr)" />
        <line x1="580" y1="208" x2="580" y2="260" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" markerEnd="url(#arr)" />

        {/* Outputs */}
        <g>
          <rect x="40" y="260" width="200" height="58" rx="8" fill="#1E5AA8" fillOpacity="0.15" stroke="#1E5AA8" strokeOpacity="0.6" />
          <text x="140" y="282" textAnchor="middle" fontSize="13" fontWeight="500" fill="currentColor">AI Arsenal · $46.0B</text>
          <text x="140" y="300" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">Sovereign GPU infrastructure</text>
        </g>
        <g>
          <rect x="260" y="260" width="200" height="58" rx="8" fill="#1D9E75" fillOpacity="0.15" stroke="#1D9E75" strokeOpacity="0.6" />
          <text x="360" y="282" textAnchor="middle" fontSize="13" fontWeight="500" fill="currentColor">Clean audit · FY28 target</text>
          <text x="360" y="300" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">$1.7B audit investments</text>
        </g>
        <g>
          <rect x="480" y="260" width="200" height="58" rx="8" fill="#5B4BC4" fillOpacity="0.15" stroke="#5B4BC4" strokeOpacity="0.6" />
          <text x="580" y="282" textAnchor="middle" fontSize="13" fontWeight="500" fill="currentColor">GenAI.mil · MSS · JFN</text>
          <text x="580" y="300" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">$2.3B CJADC2 surface</text>
        </g>

        {/* DAWG callout at bottom */}
        <g>
          <rect x="110" y="380" width="500" height="74" rx="8" fill="#C04B2D" fillOpacity="0.12" stroke="#C04B2D" strokeOpacity="0.7" strokeWidth="1.5" />
          <text x="360" y="404" textAnchor="middle" fontSize="14" fontWeight="500" fill="currentColor">Defense Autonomous Warfare Group (DAWG)</text>
          <text x="360" y="422" textAnchor="middle" fontSize="11.5" fill="hsl(var(--muted-foreground))">$225M FY26 → $53.6B FY27 — 243× growth</text>
          <text x="360" y="440" textAnchor="middle" fontSize="11.5" fill="hsl(var(--muted-foreground))">Drone Dominance target: 200,000+ autonomous systems by 2027</text>
        </g>
        <line x1="140" y1="318" x2="200" y2="380" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="3,3" markerEnd="url(#arr)" opacity="0.7" />
        <line x1="580" y1="318" x2="520" y2="380" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="3,3" markerEnd="url(#arr)" opacity="0.7" />
      </svg>
    </div>
  )
}
