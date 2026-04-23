/**
 * FY2027 Department of War Budget — raw data
 * All figures sourced from OUSW(C) FY2027 Budget Materials at comptroller.war.gov
 * plus CRFB analysis of the base defense discretionary growth.
 *
 * Keep this file pure-data so the presentation components stay focused on layout.
 */

// ------------------------------------------------------------------
// TOPLINE
// ------------------------------------------------------------------
export const TOPLINE = {
  total: 1450,                 // $B
  discretionary: 1100,         // $B
  mandatory: 350,              // $B via reconciliation
  fy26Enacted: 900,            // $B (base defense discretionary)
  headlineGrowthPct: 44,
  scrubbedBaseGrowthB: 251,    // CRFB figure
  scrubbedBaseGrowthPct: 28,
}

// ------------------------------------------------------------------
// MANDATORY BREAKDOWN ($350B across 8 sections)
// ------------------------------------------------------------------
export const MANDATORY_BY_SECTION = [
  { section: 'Defense Industrial Base',     amount: 113.1, color: '#1E5AA8' },
  { section: 'Next-Gen Tech & Autonomy',    amount: 102.5, color: '#1E5AA8' },
  { section: 'Munitions',                    amount: 47.0,  color: '#D4883A' },
  { section: 'Warrior Ethos',                amount: 36.0,  color: '#B8860B' },
  { section: 'Golden Dome / Homeland',       amount: 17.5,  color: '#C04B2D' },
  { section: 'Air Superiority',              amount: 14.4,  color: '#5B4BC4' },
  { section: 'Space Superiority',            amount: 11.7,  color: '#5B4BC4' },
  { section: 'Maritime Superiority',         amount: 7.7,   color: '#888780' },
]

// ------------------------------------------------------------------
// DISCRETIONARY BY APPROPRIATION TITLE (illustrative rollup)
// ------------------------------------------------------------------
export const DISCRETIONARY_BY_TITLE = [
  { title: 'Procurement',        amount: 257.6, share: 23.4 },
  { title: 'RDT&E',              amount: 179.4, share: 16.3 },
  { title: 'O&M',                amount: 322.1, share: 29.3 },
  { title: 'MILPERS',            amount: 198.8, share: 18.1 },
  { title: 'MILCON/FH',          amount: 19.2,  share: 1.7  },
  { title: 'DHP/COMP',           amount: 42.5,  share: 3.9  },
  { title: 'Working Capital',    amount: 80.4,  share: 7.3  },
]

// ------------------------------------------------------------------
// PROCUREMENT BY APPROPRIATION TITLE ($413B total, disc + mand)
// ------------------------------------------------------------------
export const PROCUREMENT_BY_APPROP = [
  { appropriation: 'SCN — Shipbuilding, Navy',       disc: 60.2, mand: 5.6 },
  { appropriation: 'Procurement, Defense-Wide',       disc: 10.4, mand: 39.4 },
  { appropriation: 'Other Procurement, Air Force',    disc: 39.2, mand: 0.0 },
  { appropriation: 'Missile Procurement, Army',       disc: 12.1, mand: 24.5 },
  { appropriation: 'Aircraft Procurement, Navy',      disc: 26.9, mand: 7.5 },
  { appropriation: 'Aircraft Procurement, AF',        disc: 27.0, mand: 3.7 },
  { appropriation: 'Defense Production Act (DPA)',    disc: 0.5,  mand: 29.9 },
  { appropriation: 'Weapons Procurement, Navy',       disc: 11.8, mand: 10.9 },
  { appropriation: 'Office of Strategic Capital',     disc: 0.2,  mand: 20.0 },
  { appropriation: 'Procurement, Space Force',        disc: 9.6,  mand: 9.4 },
  { appropriation: 'Other Procurement, Navy',         disc: 18.9, mand: 0.1 },
  { appropriation: 'Other Procurement, Army',         disc: 12.7, mand: 0.0 },
  { appropriation: 'Missile Procurement, Air Force',  disc: 6.8,  mand: 4.6 },
  { appropriation: 'Procurement, Marine Corps',       disc: 6.3,  mand: 0.0 },
  { appropriation: 'Ammunition, Army',                disc: 5.5,  mand: 0.0 },
  { appropriation: 'Tracked Combat Vehicles, Army',   disc: 3.7,  mand: 0.0 },
  { appropriation: 'Ammunition, Navy',                disc: 2.0,  mand: 0.0 },
  { appropriation: 'Aircraft Procurement, Army',      disc: 1.9,  mand: 0.0 },
  { appropriation: 'Ammunition, Air Force',           disc: 0.9,  mand: 0.0 },
]

// ------------------------------------------------------------------
// MAC MUNITIONS (top programs by dollars)
// ------------------------------------------------------------------
export const MAC_MUNITIONS = [
  { program: 'FY26 Procurement Disconnects',    amount: 19.56, qty: '—',           emphasis: true },
  { program: 'PAC-3 MSE',                       amount: 6.99,  qty: '1,636 msls'            },
  { program: 'THAAD',                           amount: 4.77,  qty: '373 interc.'           },
  { program: 'SM-3 Block IIA',                  amount: 2.39,  qty: '78 AURs'                },
  { program: 'SM-6',                            amount: 2.20,  qty: '280 msls'               },
  { program: 'Tomahawk (TLAM Block V)',         amount: 1.78,  qty: '685'                    },
  { program: 'JATM (AF + Navy)',                amount: 1.67,  qty: '—'                      },
  { program: 'Low-Cost Cruise Missile',         amount: 1.63,  qty: '1,000 + integ.'         },
  { program: 'AMRAAM',                          amount: 1.59,  qty: '1,006 msls'             },
  { program: 'Maritime Strike Tomahawk',        amount: 1.08,  qty: '—'                      },
  { program: 'JASSM-ER',                        amount: 1.03,  qty: '330'                    },
  { program: 'SM-3 Block IB',                   amount: 0.90,  qty: '52 AURs'                },
  { program: 'LRASM',                           amount: 0.47,  qty: '93 msls'                },
  { program: 'Low-Cost Hypersonic (Blackbeard)', amount: 0.33, qty: 'R&D'                    },
  { program: 'F-35 JATM Integration',           amount: 0.10,  qty: '—'                      },
  { program: 'F-35 LRASM Integration',          amount: 0.07,  qty: '—'                      },
  { program: 'PrSM Inc 1 (USMC)',               amount: 0.02,  qty: '10 msls'                },
]

// ------------------------------------------------------------------
// AI / AUTONOMY PORTFOLIO
// ------------------------------------------------------------------
export const AI_AUTONOMY = {
  total: 160,
  aiEnvelope: 58.5,
  autonomyEnvelope: 53.6,
  stEnvelope: 48.0,
  sovereignInfra: 46.0,
  sovereignInfraShare: 79,     // % of AI envelope
  dawgFy26: 0.225,
  dawgFy27: 53.6,
  dawgMultiplier: 243,
}

export const AI_AUTONOMY_BREAKDOWN = [
  { item: 'Sovereign AI infrastructure',    amount: 46.0,  category: 'AI'       },
  { item: 'Asset purchases (drones)',        amount: 16.85, category: 'Autonomy' },
  { item: 'Counter-UXS',                      amount: 14.4,  category: 'Autonomy' },
  { item: 'Contested logistics',              amount: 13.53, category: 'Autonomy' },
  { item: 'AI applications',                  amount: 6.8,   category: 'AI'       },
  { item: 'Collaborative autonomy',           amount: 4.5,   category: 'Autonomy' },
  { item: 'Force generation (autonomy)',      amount: 4.32,  category: 'Autonomy' },
  { item: 'AI-enabled deterrence',            amount: 2.4,   category: 'AI'       },
  { item: 'Maven Smart System / JFN',         amount: 2.3,   category: 'AI'       },
  { item: 'AI R&D',                            amount: 2.2,   category: 'AI'       },
  { item: 'AI Pace Setting Projects',         amount: 0.5,   category: 'AI'       },
]

// ------------------------------------------------------------------
// PROGRAM WINNERS AND LOSERS
// ------------------------------------------------------------------
export const WINNERS = [
  { program: 'Golden Dome for America',         amount: 17.9,  note: 'New homeland missile defense architecture' },
  { program: 'Drone Dominance / DAWG',          amount: 53.6,  note: 'Up from $225M FY26 — 243x' },
  { program: 'Sovereign AI Arsenal',            amount: 46.0,  note: 'Gov-owned accelerator infrastructure' },
  { program: 'Critical Minerals / IBAS',        amount: 48.8,  note: 'Industrial base investment' },
  { program: 'MAC Munitions',                   amount: 47.0,  note: '18 programs, PAC-3 + THAAD-led' },
  { program: 'Space Force Procurement',         amount: 19.1,  note: 'Nearly doubled. SB-AMTI at $7.7B' },
  { program: 'DPA Purchases',                   amount: 30.4,  note: '~14x historical norm' },
  { program: 'Office of Strategic Capital',     amount: 20.2,  note: '$200B credit authority behind it' },
]

export const LOSERS = [
  { program: 'SLCM-N (Sea-Launched Cruise Missile, Nuclear)', delta: '−$1.69B → $0',  note: 'Zeroed' },
  { program: 'B-21 Raider procurement',       delta: '−$3.96B',               note: '$10.07B → $6.11B' },
  { program: 'Sentinel ICBM',                 delta: '−$379M',                 note: 'Continued schedule pressure' },
  { program: 'Constellation-class frigate',   delta: 'Cancelled',              note: 'Replaced with new FF(X) program' },
  { program: 'Army UH-60M Black Hawk',        delta: '29 → 1 aircraft',        note: 'Rotary-wing drawdown' },
  { program: 'Army CH-47F Chinook',           delta: '11 → 5 aircraft',        note: 'Rotary-wing drawdown' },
  { program: 'AH-64E Apache Reman',           delta: '→ $0',                   note: 'Zeroed in FY27' },
  { program: 'Science & Technology (6.1-6.3)', delta: '−8%',                   note: 'Below-threshold per 3346 covenant' },
  { program: 'DDG-51 Arleigh Burke',          delta: '2 → 1 hull/yr',          note: 'Production step-down' },
  { program: 'Contract Services',             delta: '−$13.3B',                note: 'FTE implications significant' },
]

// ------------------------------------------------------------------
// PEACE THROUGH STRENGTH — 4 LINES OF EFFORT
// ------------------------------------------------------------------
export const LOE = [
  { short: 'HLD',           label: 'Homeland Defense',       amount: 185, note: 'Golden Dome core, border, space domain awareness' },
  { short: 'Deter China',   label: 'Deter China',            amount: 445, note: 'INDOPACOM posture, munitions, AUKUS, Space Force' },
  { short: 'Burden-Sharing', label: 'Allied Burden-Sharing',  amount: 120, note: 'NATO 5% commitments, EDI reshape' },
  { short: 'DIB',           label: 'Defense Industrial Base', amount: 348, note: 'Munitions, shipbuilding, microelectronics, critical minerals' },
]

// ------------------------------------------------------------------
// EXECUTION RISKS
// ------------------------------------------------------------------
export const RISKS = [
  { severity: 'high',   risk: 'Reconciliation vehicle',      detail: '$350B (24% of request) depends on a reconciliation bill that has not yet moved. If blocked, the department loses mandatory flexibility and falls back to discretionary caps.' },
  { severity: 'high',   risk: 'BLI / PE consolidation',      detail: 'Proposed consolidation of Program Elements and Budget Line Items reduces congressional line-item visibility. Markup may reject and restore granularity.' },
  { severity: 'medium', risk: 'Defense-Wide span of control',  detail: '70% of mandatory ($245B) flows through OSD-controlled appropriations. OUSD(A&S) and CDAO are not sized to execute at this scale — expect significant MIPR pass-through.' },
  { severity: 'medium', risk: 'DAWG scale-up execution',     detail: '243x year-over-year growth. Contracts, oversight, and workforce cannot ramp at that rate — expect Q4 carryover and OUO reprogramming.' },
  { severity: 'medium', risk: 'Semiconductor dependency',    detail: 'Sovereign AI Arsenal at $46B implies 100Ks of accelerators. Dependent on CHIPS Act follow-on legislation for substrate/packaging.' },
  { severity: 'low',    risk: 'Reform savings realism',      detail: 'Claimed ~$50B in Pentagon savings embedded in topline. Historical realization rate of announced savings is typically 30-50%.' },
]
