/**
 * DoD FY2025 Audit — Inside Analysis
 *
 * All figures from:
 *   DODIG-2026-032, Dec 18, 2025 — "Independent Auditor's Reports on the DoD FY 2025
 *   Financial Statements"
 *   Jan 12, 2026 Hegseth/Feinberg memo — "Transforming Advana to Accelerate AI
 *   and Enhance Auditability"
 *   USW(C)/CFO response letter (Jules W. Hurst III), Dec 18, 2025
 *
 * Keep this file pure-data so the presentation components stay focused on layout.
 */

// ------------------------------------------------------------------
// TOPLINE
// ------------------------------------------------------------------
export const AUDIT_TOPLINE = {
  opinion: 'Disclaimer of Opinion',
  reportNumber: 'DODIG-2026-032',
  reportDate: 'December 18, 2025',
  materialWeaknesses: 26,
  significantDeficiencies: 2,
  noncomplianceInstances: 5,
  entitiesWithDisclaimers: 11,
  assetCoverage: 43,              // % of DoD total assets under disclaimer
  budgetaryCoverage: 64,          // % of total budgetary resources under disclaimer
  unsupportedAdjustments: 5665,
  unsupportedAdjustmentsB: 859,
  buildingPartnerMisstatementB: 18.9,
  tI97FbwtB: 223.8,
  tI97ShareOfFbwt: 22,            // % of total FBWT
  fbwtTotalT: 1.0,
  jsfLifeCycleT: 2.0,
  ffmiaNoncompliantSystems: 130,
  ffmiaNoncomplianceSince: 2001,
  targetCleanAuditAgencyFY: 2028,
  targetCleanAuditDwcfFY: 2027,
  cleanAuditServicesAchieved: 1,  // USMC only
}

// ------------------------------------------------------------------
// 11 ENTITIES THAT RECEIVED DISCLAIMERS
// ------------------------------------------------------------------
export const DISCLAIMED_ENTITIES = [
  { entity: 'Department of the Army General Fund',               branch: 'Army',          tier: 'Large' },
  { entity: 'Department of the Army Working Capital Fund',        branch: 'Army',          tier: 'Medium' },
  { entity: 'U.S. Navy General Fund',                             branch: 'Navy',          tier: 'Large' },
  { entity: 'Department of the Air Force General Fund',           branch: 'Air Force',     tier: 'Large' },
  { entity: 'Department of the Air Force Working Capital Fund',   branch: 'Air Force',     tier: 'Medium' },
  { entity: 'U.S. Transportation Command WCF',                    branch: 'TRANSCOM',      tier: 'Medium' },
  { entity: 'Defense Intelligence Agency',                        branch: '4th Estate',    tier: 'Medium' },
  { entity: 'National Geospatial-Intelligence Agency',            branch: '4th Estate',    tier: 'Medium' },
  { entity: 'Defense Health Program General Fund',                branch: '4th Estate',    tier: 'Large' },
  { entity: 'Defense Information Systems Agency General Fund',    branch: '4th Estate',    tier: 'Medium' },
  { entity: 'Defense Logistics Agency Working Capital Fund',      branch: '4th Estate',    tier: 'Large' },
]

// USMC achieved clean — highlight this as the proof case
export const CLEAN_OPINION_COMPONENTS = [
  { entity: 'U.S. Marine Corps',  note: 'First Military Service to achieve clean opinion. Used Advana Seller Elimination Workbooks + Qlik interface remediation.' },
]

// ------------------------------------------------------------------
// 26 MATERIAL WEAKNESSES — grouped by remediation theme
// ------------------------------------------------------------------
export const MATERIAL_WEAKNESSES = [
  // Theme: Systems & IT (7)
  { num: 1,  name: 'Financial Management Systems Modernization',   theme: 'Systems/IT',       advanaTouch: 'Indirect', dollarB: null },
  { num: 2,  name: 'Configuration Management',                      theme: 'Systems/IT',       advanaTouch: 'Indirect', dollarB: null },
  { num: 3,  name: 'Security Management',                           theme: 'Systems/IT',       advanaTouch: 'Indirect', dollarB: null },
  { num: 4,  name: 'Access Controls',                               theme: 'Systems/IT',       advanaTouch: 'Indirect', dollarB: null },
  { num: 5,  name: 'Segregation of Duties',                         theme: 'Systems/IT',       advanaTouch: 'Indirect', dollarB: null },
  { num: 6,  name: 'Interface Controls',                            theme: 'Systems/IT',       advanaTouch: 'Direct',   dollarB: null },
  { num: 7,  name: 'Universe of Transactions',                      theme: 'Transactions',     advanaTouch: 'Core',     dollarB: null },

  // Theme: Asset Valuation (6)
  { num: 8,  name: 'Fund Balance with Treasury',                    theme: 'Asset Valuation',  advanaTouch: 'Direct',   dollarB: 1000 },
  { num: 9,  name: 'Inventory and Stockpile Materials',             theme: 'Asset Valuation',  advanaTouch: 'Direct',   dollarB: 155.4 },
  { num: 10, name: 'Operating Materials and Supplies',              theme: 'Asset Valuation',  advanaTouch: 'Direct',   dollarB: 231.0 },
  { num: 11, name: 'General Property, Plant, and Equipment',        theme: 'Asset Valuation',  advanaTouch: 'Direct',   dollarB: 501.2 },
  { num: 12, name: 'Real Property',                                 theme: 'Asset Valuation',  advanaTouch: 'Direct',   dollarB: 478.7 },
  { num: 13, name: 'Government Property in Contractor Possession',  theme: 'Asset Valuation',  advanaTouch: 'Direct',   dollarB: null },

  // Theme: High-Value Programs (1)
  { num: 14, name: 'Joint Strike Fighter Program',                  theme: 'High-Value Programs', advanaTouch: 'Direct', dollarB: 2000 },

  // Theme: Liabilities & Transactions (6)
  { num: 15, name: 'Accounts Payable',                              theme: 'Liabilities/Tx',   advanaTouch: 'Direct',   dollarB: 49.8 },
  { num: 16, name: 'Environmental and Disposal Liabilities',        theme: 'Liabilities/Tx',   advanaTouch: 'Indirect', dollarB: 108.0 },
  { num: 17, name: 'Leases (SFFAS 54)',                              theme: 'Liabilities/Tx',   advanaTouch: 'Indirect', dollarB: null },
  { num: 18, name: 'Unsupported Accounting Adjustments',            theme: 'Liabilities/Tx',   advanaTouch: 'Core',     dollarB: 859.0 },
  { num: 19, name: 'Intragov Transactions & Intradept Eliminations', theme: 'Liabilities/Tx',  advanaTouch: 'Core',     dollarB: null },
  { num: 20, name: 'Gross Costs',                                   theme: 'Liabilities/Tx',   advanaTouch: 'Direct',   dollarB: 1500 },

  // Theme: Revenue & Budgetary (3)
  { num: 21, name: 'Earned Revenue',                                theme: 'Revenue/Budget',   advanaTouch: 'Direct',   dollarB: 569.6 },
  { num: 22, name: 'Reconciliation of Net Cost to Net Outlays',     theme: 'Revenue/Budget',   advanaTouch: 'Core',     dollarB: 1.3 },
  { num: 23, name: 'Budgetary Resources',                           theme: 'Revenue/Budget',   advanaTouch: 'Core',     dollarB: null },

  // Theme: Oversight & Controls (3)
  { num: 24, name: 'Service Organizations',                         theme: 'Oversight',        advanaTouch: 'Indirect', dollarB: null },
  { num: 25, name: 'Component Entity-Level Controls',               theme: 'Oversight',        advanaTouch: 'Indirect', dollarB: null },
  { num: 26, name: 'DoD-Wide Oversight and Monitoring',             theme: 'Oversight',        advanaTouch: 'Direct',   dollarB: 18.9 },
]

// ------------------------------------------------------------------
// THEME ROLLUPS for chart
// ------------------------------------------------------------------
export const THEMES = [
  { theme: 'Systems/IT',          count: 7, color: '#5B4BC4' },
  { theme: 'Asset Valuation',     count: 6, color: '#1E5AA8' },
  { theme: 'Liabilities/Tx',      count: 6, color: '#D4883A' },
  { theme: 'Revenue/Budget',      count: 3, color: '#4C9C6F' },
  { theme: 'Oversight',           count: 3, color: '#888780' },
  { theme: 'High-Value Programs', count: 1, color: '#C04B2D' },
]

// ------------------------------------------------------------------
// SIGNIFICANT DEFICIENCIES (2) + NONCOMPLIANCE (5)
// ------------------------------------------------------------------
export const SIGNIFICANT_DEFICIENCIES = [
  { name: 'Risk Management Framework (RMF)',          detail: 'DoD did not fully conduct control assessments, system risk assessments, or implement continuous monitoring for financial management systems. NIST SP 800-37 non-compliance.' },
  { name: 'Non-Federal Accounts Receivable',          detail: '$15.6B balance. Components cannot provide AR subsidiary ledger at invoice level that reconciles to general ledger. Prior-period collections not liquidated in accounting records.' },
]

export const NONCOMPLIANCE = [
  { law: 'Antideficiency Act (ADA)',                                severity: 'high',   detail: '$106.9M in FY25 violations across 2 cases. 8 ongoing investigations, 4 open >15 months. Discontinued Research Packages process creates standing ADA risk.' },
  { law: 'Federal Financial Management Improvement Act (FFMIA)',     severity: 'high',   detail: '130+ financial management systems non-compliant. No strategy to bring systems compliant or retire in timely manner. DoD has acknowledged noncompliance since FY2001.' },
  { law: "Federal Managers' Financial Integrity Act (FMFIA)",        severity: 'medium', detail: 'Components did not perform complete risk assessments, monitor FMFIA internal control assessment programs, or implement corrective actions timely.' },
  { law: 'Federal Information Security Modernization Act (FISMA)',   severity: 'medium', detail: 'Multiple Components non-compliant with NIST SP 800-53. Configuration management, security management, access controls, SoD, CUECs not fully implemented.' },
  { law: 'Debt Collection Improvement Act',                          severity: 'low',    detail: 'One Component could not sufficiently support validity of recorded debts. Audit procedures limited.' },
]

// ------------------------------------------------------------------
// DOLLAR-AT-RISK — material misstatements and exposed balances
// ------------------------------------------------------------------
export const DOLLAR_AT_RISK = [
  { label: 'JSF life-cycle cost (Global Spares omitted)',  amount: 2000, context: 'Material misstatement — unquantifiable', severity: 'high' },
  { label: 'Gross Costs balance',                           amount: 1500, context: 'Reported but insufficient support',       severity: 'medium' },
  { label: 'Fund Balance with Treasury',                    amount: 1000, context: 'TI-97 reconciliation unsupported',        severity: 'high' },
  { label: 'Unsupported accounting adjustments',            amount: 859,  context: '5,665+ adjustments, last 2 quarters FY25', severity: 'high' },
  { label: 'Earned Revenue',                                amount: 569.6, context: 'Support deficiencies',                     severity: 'medium' },
  { label: 'General PP&E',                                  amount: 501.2, context: 'Valuation documentation gaps',             severity: 'medium' },
  { label: 'Real Property',                                 amount: 478.7, context: 'No complete UoT, existence gaps',          severity: 'medium' },
  { label: 'Operating Materials & Supplies',                amount: 231.0, context: 'SFFAS 3/48 non-compliance',                severity: 'medium' },
  { label: 'Inventory & Stockpile Materials',               amount: 155.4, context: 'SFFAS 3/48 non-compliance',                severity: 'medium' },
  { label: 'Environmental & Disposal Liabilities',          amount: 108.0, context: 'Incomplete site universe',                 severity: 'medium' },
  { label: 'Accounts Payable',                              amount: 49.8,  context: 'Existence documentation gaps',             severity: 'medium' },
  { label: 'Building Partner Capacity misstatement',        amount: 18.9,  context: 'Confirmed material misstatement',         severity: 'high' },
]

// ------------------------------------------------------------------
// FY2028 CLEAN AUDIT ROADMAP
// ------------------------------------------------------------------
export const ROADMAP_MILESTONES = [
  { fy: 'FY25', label: 'Disclaimer (current)',      date: 'Dec 2025', status: 'done',    note: '8th consecutive disclaimer. 26 MWs identified.' },
  { fy: 'FY26', label: 'DWCF preparation',          date: 'Q1–Q4 FY26', status: 'in-progress', note: 'Stand up Advana for Financial Management. 45-day DepSec reporting cadence until FOC.' },
  { fy: 'FY27', label: 'DWCF Clean Audit (target)', date: 'Q4 FY27',  status: 'target',  note: '2-year cycle combined DWCF Financial Report. First unmodified opinion milestone.' },
  { fy: 'FY28', label: 'Agency-wide Clean Audit',   date: 'Q4 FY28',  status: 'target',  note: 'USW(C)/CFO commitment letter: unmodified opinion on FY28 agency-wide financial statements.' },
]

// ------------------------------------------------------------------
// ADVANA CAPABILITY → MATERIAL WEAKNESS MAPPING
// This is the heart of the page — shows where data+AI actually addresses audit gaps
// ------------------------------------------------------------------
export const ADVANA_CAPABILITIES = [
  {
    capability: 'Seller Elimination Workbooks',
    owner: 'Advana FinMgmt',
    addresses: ['Intragov Transactions & Intradept Eliminations (MW 19)'],
    proof: 'USMC used this to remediate IGT Material Weakness on the path to clean opinion.',
    aimlDepth: 'Rule-based + trading partner matching',
  },
  {
    capability: 'Qlik Obligation Interface Analytics',
    owner: 'Advana FinMgmt',
    addresses: ['Interface Controls (MW 6)', 'Budgetary Resources (MW 23)'],
    proof: 'USMC used Qlik capability to resolve obligation interface errors in general ledger.',
    aimlDepth: 'Dashboard analytics + anomaly flagging',
  },
  {
    capability: 'Universe of Transactions (UoT) Engine',
    owner: 'Advana Core',
    addresses: ['Universe of Transactions (MW 7)', 'Unsupported Accounting Adjustments (MW 18)', 'Gross Costs (MW 20)'],
    proof: 'Original Advana purpose. 38+ FMS integrated by 2019; billions of linked transactions.',
    aimlDepth: 'Data lineage + transaction-level ingestion',
  },
  {
    capability: 'Automated FBWT Reconciliation',
    owner: 'Advana FinMgmt + DFAS',
    addresses: ['Fund Balance with Treasury (MW 8)'],
    proof: 'Automated TI-97 reconciliation replaces 50+ manual agency reconciliations.',
    aimlDepth: 'Rules engine + exception surfacing',
  },
  {
    capability: 'Accountable Property Integration',
    owner: 'Advana Logistics',
    addresses: ['Inventory & Stockpile (MW 9)', 'OM&S (MW 10)', 'General PP&E (MW 11)', 'Real Property (MW 12)', 'Government Property in Contractor Possession (MW 13)'],
    proof: 'Ingests accountable property systems of record — single source for valuation support.',
    aimlDepth: 'Data integration + SFFAS-compliant reporting templates',
  },
  {
    capability: 'GenAI.mil Discovery Agent',
    owner: 'WDP Application Services',
    addresses: ['Universe of Transactions (MW 7)', 'Accounts Payable (MW 15)', 'Unsupported Adjustments (MW 18)'],
    proof: 'Natural-language query across ingested sources. Finds supporting documentation auditors request.',
    aimlDepth: 'LLM + RAG over ingested source docs',
  },
  {
    capability: 'Anomaly Detection on Journal Vouchers',
    owner: 'Advana FinMgmt AI',
    addresses: ['Unsupported Accounting Adjustments (MW 18)', 'Intragov Transactions (MW 19)'],
    proof: 'Surfaces the 5,665 unsupported adjustments totaling $859B for triage before close.',
    aimlDepth: 'Statistical outlier detection + ML classifiers',
  },
  {
    capability: 'Agentic Reconciliation Workflow',
    owner: 'WDP App Services',
    addresses: ['SF-132 to SF-133 Recon (MW 23)', 'Note 24 Recon (MW 22)'],
    proof: 'Agent pipelines replace manual reconciliation cycles. Component-to-agency flow.',
    aimlDepth: 'Multi-step agentic AI + tool use',
  },
  {
    capability: 'Contract Spend Attestation',
    owner: 'Advana Acquisition',
    addresses: ['Government Property in Contractor Possession (MW 13)', 'Joint Strike Fighter (MW 14)'],
    proof: 'Ties contract modifications to property records. Addresses JSF Global Spares visibility gap.',
    aimlDepth: 'Graph analytics + entity resolution',
  },
  {
    capability: 'Management Response Drafting',
    owner: 'GenAI.mil',
    addresses: ['All 26 MWs (CAP drafting phase)'],
    proof: 'LLM-assisted CAP drafting with citation to source system evidence. Accelerates response cycle.',
    aimlDepth: 'LLM + structured prompt templates',
  },
]

// ------------------------------------------------------------------
// ACTIONABLE REMEDIATION ROADMAP — by horizon
// ------------------------------------------------------------------
export const ACTIONABLE_90DAY = [
  { action: 'Complete Advana personnel reassignment to FinMgmt track', owner: 'CDAO',           source: 'Feinberg memo (30-day directive)' },
  { action: 'Stand up dedicated FinMgmt control plane',                 owner: 'CDAO + DCFO',    source: 'Feinberg memo (30-day directive)' },
  { action: 'Triage 5,665 unsupported adjustments via anomaly detection', owner: 'DFAS + Advana', source: 'MW 18 remediation' },
  { action: 'Complete DWCF trial balance ingestion to Advana FinMgmt',   owner: 'DCFO',          source: 'FY27 DWCF milestone' },
  { action: 'USMC playbook codification (Seller Elim + Qlik)',           owner: 'Advana FinMgmt', source: 'Replicate clean-opinion pattern' },
]

export const ACTIONABLE_6MONTH = [
  { action: 'Complete TI-97 FBWT reconciliation engine in production',  owner: 'Advana + DFAS',  source: 'MW 8 remediation' },
  { action: 'Deploy agentic reconciliation for SF-132 to SF-133',        owner: 'WDP App Svcs',   source: 'MW 22, MW 23' },
  { action: 'Stand up CAP drafting workflow via GenAI.mil',              owner: 'DCFO + CDAO',    source: 'Acceleration across all 26 MWs' },
  { action: '45-day DepSec status reports for WDP + Advana FinMgmt FOC', owner: 'CDAO',           source: 'Feinberg memo standing requirement' },
  { action: 'Accountable Property Systems (APSR) consolidation Phase 1', owner: 'DCFO + Services', source: 'MWs 9-13' },
  { action: 'ICAM (Identity/Credential/Access Mgmt) enforcement to 90%', owner: 'DoW CIO',        source: 'MW 4 remediation' },
]

export const ACTIONABLE_12MONTH = [
  { action: 'Retire first 30 FFMIA-noncompliant legacy systems',         owner: 'DoW CIO + Services', source: 'MW 1 — 130+ systems targeted' },
  { action: 'DWCF Combined Financial Report unmodified opinion',          owner: 'USW(C)/CFO',        source: 'FY27 Clean Audit target' },
  { action: 'JSF Global Spares Pool in accountable property system',      owner: 'OUSW(A&S) + F-35 JPO', source: 'MW 14 — unquantifiable misstatement' },
  { action: 'Building Partner Capacity accounting fix deployed',          owner: 'DCFO',              source: 'MW 26 — $18.9B confirmed misstatement' },
  { action: 'Close at least 5 ADA cases over 15 months old',              source: 'Noncompliance #1', owner: 'USW(C)/CFO' },
  { action: 'Component-level CUEC testing coverage → 80%',                owner: 'Components',        source: 'MW 24 Service Organizations' },
]

// ------------------------------------------------------------------
// ADVANA DATA PIPELINE PRIORITIES (from Feinberg memo)
// ------------------------------------------------------------------
export const DATA_PIPELINES = [
  { pipeline: 'Financial',   criticality: 'Core',        examples: 'General ledgers, SF-132/133, USSGL, TI-97 FBWT' },
  { pipeline: 'Acquisition', criticality: 'High',        examples: 'Contract files, obligations, mods, EVM, JSF GSP' },
  { pipeline: 'Logistics',   criticality: 'High',        examples: 'APSRs, inventory, OM&S, real property registers' },
  { pipeline: 'Readiness',   criticality: 'Supporting',  examples: 'DRRS feeds, cost-per-output, unit-level data' },
]

// ------------------------------------------------------------------
// RISK REGISTER — things that could blow up the FY28 plan
// ------------------------------------------------------------------
export const FY28_RISKS = [
  { severity: 'high',   risk: 'Legacy system retirement lag',   detail: 'Several FMS systems not scheduled to retire until FY2031 despite FY2028 clean-audit goal. Materially misaligned timelines.' },
  { severity: 'high',   risk: 'Advana trifurcation execution',  detail: 'Splitting into WDP / Advana FinMgmt / WDP App Svcs in < 24 months with 45-day reporting cadence is aggressive. Organizational friction near certain.' },
  { severity: 'high',   risk: 'JSF Global Spares data gap',     detail: 'Unquantifiable misstatement. Until DoD can verify existence/value of GSP assets, agency opinion is blocked regardless of other progress.' },
  { severity: 'medium', risk: 'Unsupported adjustments volume', detail: '5,665+ in two quarters. Even with AI triage, root-cause remediation requires source-system and process changes, not just detection.' },
  { severity: 'medium', risk: 'FFMIA tail',                     detail: 'DoD acknowledged FFMIA noncompliance since FY2001. 25-year tail suggests structural issues beyond the current reform window.' },
  { severity: 'medium', risk: 'Service Organizations (SOC)',    detail: '10 of 28 SOC reports qualified/adverse. Complementary User Entity Controls (CUECs) gap across multiple Components.' },
  { severity: 'low',    risk: 'IG transparency signal',         detail: 'FY25 AFR omitted Advana performance section. Could complicate congressional oversight and confidence in the data-driven remediation thesis.' },
]

// ------------------------------------------------------------------
// AI/ML PLAYS — grouped by technique
// ------------------------------------------------------------------
export const AIML_PLAYS = [
  {
    play: 'Anomaly detection on journal vouchers',
    mw: 'MW 18 (Unsupported Adjustments)',
    technique: 'Isolation forests / autoencoders',
    where: 'Advana FinMgmt + DFAS',
    outcome: 'Surface 5,665+ adjustments for triage before quarter close.',
  },
  {
    play: 'Trading partner reconciliation graph',
    mw: 'MW 19 (IGT/IDE)',
    technique: 'Graph DB + entity resolution',
    where: 'Advana Core',
    outcome: 'Auto-match buyer/seller transactions. Flag unmatched for human review.',
  },
  {
    play: 'Natural-language supporting doc search',
    mw: 'MW 15 (A/P), MW 18, MW 7 (UoT)',
    technique: 'LLM + RAG over ingested sources',
    where: 'GenAI.mil surface',
    outcome: 'Auditor asks "show me the invoice for this A/P entry" — system retrieves scanned doc + metadata.',
  },
  {
    play: 'Automated SF-132 to SF-133 reconciliation',
    mw: 'MW 23 (Budgetary Resources)',
    technique: 'Rules engine + variance modeling',
    where: 'Advana FinMgmt',
    outcome: 'Replace manual Component-level spreadsheet work. Variance root-cause flags.',
  },
  {
    play: 'Cancellation-risk prediction for expiring funds',
    mw: 'MW 23, ADA risk',
    technique: 'Time-series + XGBoost',
    where: 'Advana FinMgmt',
    outcome: 'Predict which TAFS will cancel unliquidated obligations. Trigger reprogramming earlier.',
  },
  {
    play: 'Interface error clustering',
    mw: 'MW 6 (Interface Controls)',
    technique: 'Clustering + classification',
    where: 'Qlik in Advana',
    outcome: 'USMC proved this — groups interface errors for systematic fix, not case-by-case.',
  },
  {
    play: 'Entity resolution for property records',
    mw: 'MWs 11, 12, 13, 14',
    technique: 'Probabilistic record linkage',
    where: 'Advana Logistics',
    outcome: 'Match assets across 10+ APSRs when serial numbers are inconsistent.',
  },
  {
    play: 'Agentic CAP drafting',
    mw: 'All 26 MWs',
    technique: 'LLM agents + tool use',
    where: 'GenAI.mil',
    outcome: 'Draft management responses with citations. Human finalizes rather than drafts from scratch.',
  },
  {
    play: 'Access control anomaly detection',
    mw: 'MW 4, MW 5, MW 24',
    technique: 'Behavioral analytics',
    where: 'ICAM + Advana',
    outcome: 'Flag inappropriate access patterns, orphan accounts post-separation.',
  },
  {
    play: 'Lease classification LLM',
    mw: 'MW 17 (SFFAS 54)',
    technique: 'LLM classification + extraction',
    where: 'Advana Acquisition',
    outcome: 'Read lease contracts, classify under SFFAS 54, extract terms for note disclosure.',
  },
]
