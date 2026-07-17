/**
 * USMC FY2025 Audit Success — Lessons Learned for DoD-wide Remediation
 *
 * Primary source:
 *   FY 2025 United States Marine Corps Agency Financial Report (AFR), published Feb 9, 2026
 *   Independent Auditor's Reports by Ernst & Young LLP, dated February 6, 2026
 *   DODIG-2026-050, Project No. D2025-D000FS-0061.000
 *   "Transmittal of the Independent Auditor's Report on the U.S. Marine Corps General Fund
 *   Financial Statements and Related Notes for FY 2025"
 *
 * Cross-referenced against DODIG-2026-032 (DoD-wide FY2025 audit) and the Jan 12, 2026
 * Hegseth/Feinberg Advana memo — see components/features/audit-inside/data.ts.
 *
 * Keep this file pure-data so presentation components stay focused on layout.
 */

// ------------------------------------------------------------------
// TOPLINE
// ------------------------------------------------------------------
export const USMC_TOPLINE = {
  opinion: 'Unmodified (Clean)',
  consecutiveCleanYears: 2,               // FY2024 (first), FY2025 (sustained)
  reportNumber: 'DODIG-2026-050',
  reportDate: 'February 6, 2026',
  auditor: 'Ernst & Young LLP',
  fiscalYearEnd: 'September 30, 2025',
  materialWeaknesses: 7,
  newMW: 0,
  resolvedMW: 0,
  significantDeficiencies: 0,
  noncomplianceInstances: 2,              // FFMIA, FMFIA
  adaViolationsFY25: 0,
  improperPaymentRate: 1.98,              // %
  totalAssetsB: 52.0,
  totalLiabilitiesB: 5.3,
  netPositionB: 46.7,
  gppeNetB: 25.1,
  totalAppropriationsB: 40.48,
  meWorkbookValueB: 5.5,                  // military equipment tracked via Excel
  cipWorkbookValueB: 3.0,                 // construction-in-progress tracked via Excel
  omsUniqueNsns: 7000,
  daiIncomingInterfaces: 27,
  firstCleanOpinionFY: 2025,              // as reported by DoD-wide materials (calendar FY2024 audit, issued ~FY2025); this AFR (FY2025) is the sustaining year
}

// ------------------------------------------------------------------
// TIMELINE — the compelling arc from disclaimer to sustained clean opinion
// ------------------------------------------------------------------
export const USMC_TIMELINE = [
  { period: 'FY2017–FY2023', label: 'Disclaimers of opinion', detail: 'USMC General Fund, like every other Military Department, received consecutive disclaimers alongside the rest of DoD. Legacy manual processes, fragmented systems (DAI, GCSS-MC, MCTFS), no unified evidence trail.' },
  { period: 'FY2024', label: 'First clean opinion — a Military Service "first"', detail: 'USMC becomes the first Military Service to achieve an unmodified opinion, using Advana Seller Elimination Workbooks and Qlik obligation-interface analytics to close the intragovernmental and interface-error gaps that had blocked prior years.' },
  { period: 'FY2025', label: 'Second consecutive clean opinion — the harder proof', detail: 'EY again issues an unmodified opinion. Critically, all 7 material weaknesses from FY2024 carry forward unchanged: 0 new, 0 resolved. This is the year that proves the FY2024 result wasn\'t a one-off — sufficiency of audit evidence, not absence of control deficiencies, is what unlocked the opinion.' },
  { period: 'FY2026 (in progress)', label: 'RMIC governance maturation', detail: 'Marine Corps Order 5200.24F revised; new governance structure stood up in FY2025 continues to mature. Oversight & Monitoring material weakness is the one EY estimates could downgrade by FY2028 — the longest-dated of the seven.' },
]

// ------------------------------------------------------------------
// THE 7 MATERIAL WEAKNESSES — full detail from Appendix A + Figure 12
// ------------------------------------------------------------------
export type MWNature = 'Governance' | 'Process/Manual' | 'IT General Controls'

export const USMC_MATERIAL_WEAKNESSES = [
  {
    num: 1,
    name: 'Oversight and Monitoring (Entity Level Controls)',
    nature: 'Governance' as MWNature,
    rootCause: 'No consistently implemented formal internal control program across all five GAO Green Book components (Control Environment, Risk Assessment, Control Activities, Information & Communication, Monitoring) and their 17 principles. Insufficient review/monitoring of Service Provider SOC 1 reports and Complementary User Entity Controls (CUECs).',
    keyIssues: [
      'Control activities not consistently mapped to risks or control objectives',
      'Information systems supporting financial transactions not fully catalogued',
      'Monitoring controls for combined-basis performance not designed or implemented',
      'SOC 1 reports from Service Providers not sufficiently reviewed; CUECs not properly mapped',
    ],
    recommendation: 'Consistently implement RMIC across all business process areas; formalize quarterly reporting to the Assistant Commandant with root-cause analysis; design POA&M-based IT vulnerability tracking; formalize Service Provider SOC 1 review and compensating controls.',
    fy25Status: 'Governance structure stood up FY2025 and evolved through the year — improved ELC Assessment, expanded Priority Business Process reviews to 3 more processes, performed SOC 1 evaluations. EY estimates this MW could downgrade by FY2028 — the only one with an explicit downgrade estimate.',
    leverage: 'Organizational discipline, not technology spend. The fix is process maturity and documentation rigor.',
    dollarExposure: null,
  },
  {
    num: 2,
    name: 'Budget Execution & Monitoring',
    nature: 'Process/Manual' as MWNature,
    rootCause: 'Documentation, authorization, recordation, and reporting deficiencies across the Procure-to-Pay cycle. DAI\'s strict period-end cutoff forces manual tracking of late interface files as temporary journal vouchers, raising misstatement risk at every close.',
    keyIssues: [
      'Large volume of unmatched transactions in DAI',
      'Dormant obligations not deobligated timely',
      'Field-level abnormal balances (corrected, but evidence of weak controls)',
      'Accounts Payable balance is estimated via accrual methodology rather than transaction-level detail',
    ],
    recommendation: 'Design reconciliation/anomaly-threshold controls for P2P; move off manually tracked journal vouchers toward standard data-entry procedures; monitor unliquidated obligations and downward adjustments; align risk tolerance for "unmatched" obligations/disbursements with OMB/Treasury guidance.',
    fy25Status: 'Systems and Data Integration division (stood up late FY2024) fully operational for all of FY2025 — more frequent unpaid-obligation validation, unmatched-transaction levels held down. Automation/AI pilot launched on the contract-writing system interface.',
    leverage: 'Mixed — some fixable by process discipline now, some genuinely gated on DAI/interface modernization.',
    dollarExposure: null,
  },
  {
    num: 3,
    name: 'General Property, Plant and Equipment (GPP&E)',
    nature: 'Process/Manual' as MWNature,
    rootCause: 'No end-to-end designed/implemented controls for GPP&E acquisitions, disposals, and construction-in-progress. Military Equipment APSR (GCSS-MC) lacks fields for full cost, depreciation, useful life, and in-service date — all tracked manually in Excel instead.',
    keyIssues: [
      '$5.5B of Military Equipment tracked via multi-step Excel workbook, not the system of record',
      '$3.0B of construction-in-progress tracked via manual Excel workbooks',
      'Inconsistent "birthing" of new ME assets into GCSS-MC, risking balance sheet misstatement',
      'Real property constructive receipt timing not consistently controlled',
    ],
    recommendation: 'Reconcile APSR to general ledger with monitoring controls; capture capitalize-vs-expense decisions at contract inception; ensure constructive receipt is recorded before FY-end; add missing valuation fields to GCSS-MC or a compensating system.',
    fy25Status: 'USMC completed a joint PP&E/OM&S study in FY2025 documenting statutory requirements, current manual workarounds, and a roadmap to reduce manual burden — investment decisions are "actively under consideration," not yet funded/executed.',
    leverage: 'IT investment gated — the workaround (Excel) works for evidence today but is not scalable and is itself flagged as inherent risk.',
    dollarExposure: 8.5,
  },
  {
    num: 4,
    name: 'Inventory & Related Property: Operating Materials & Supplies (OM&S)',
    nature: 'Process/Manual' as MWNature,
    rootCause: 'OM&S quantity, receipt, and price data live in three separate systems; ~7,000 unique NSNs/NIINs valued via weighted-average-cost calculated in Excel workbooks rather than system-integrated tooling.',
    keyIssues: [
      'WAC calculation documentation didn\'t always support quantities/prices used',
      'Transactions misclassified as receipts when they were not receipts',
      'Work-in-progress transactions not accurately tracked end-to-end',
      'Marking/tagging inconsistency produced incorrect quantities and values in the APSR',
      'Ammo in-transit population not reliably controlled at period-end',
    ],
    recommendation: 'Integrate quantity/receipt/price data sources; reconcile Automated Information System (AIS) to APSR; implement consistent marking/tagging controls; automate WAC compilation instead of Excel-based calculation.',
    fy25Status: 'Bundled into the same FY2025 PP&E/OM&S study as MW #3 — same "under consideration" status for automation investment.',
    leverage: 'IT/data-integration investment gated, same as GPP&E.',
    dollarExposure: null,
  },
  {
    num: 5,
    name: 'Financial Information Systems – Access Controls / Segregation of Duties',
    nature: 'IT General Controls' as MWNature,
    rootCause: 'Provisioning, modification, and removal of privileged/non-privileged access not consistently performed against defined requirements and timelines; no cross-application SoD conflict matrix; SoD conflicts not consistently reviewed before access is granted.',
    keyIssues: [
      'Access recertification insufficient to evaluate need and appropriateness of access level',
      'Evidence of completeness/accuracy of access-review listings not retained',
      'No cross-application SoD analysis for users spanning multiple financial systems',
      'No mitigating control to monitor users with conflicting roles',
    ],
    recommendation: 'Confirm access provisioning/removal against defined requirements; design recertification program; evaluate cross-application SoD; document and monitor unavoidable conflicting-role exceptions.',
    fy25Status: 'Marine Corps-owned systems transitioning into the Naval Identity Service (NIS) DON ICAM solution. GCSS-MC onboarded to NIS ICAM in FY2025 for automated provisioning, SoD conflict risk acceptance, and recertification. DAI\'s onboarding to DISA Enterprise ICAM is scheduled for FY2026 — FY2026 is called out as "pivotal" for closing NIS ICAM gaps.',
    leverage: 'Technology-gated but on a funded, scheduled path (ICAM rollout) — the most concretely "in motion" of the three IT MWs.',
    dollarExposure: null,
  },
  {
    num: 6,
    name: 'Financial Information Systems – Configuration Management',
    nature: 'IT General Controls' as MWNature,
    rootCause: 'No complete, accurate inventory of application/table/data/configuration changes to production; changes not consistently monitored for authorization; investigation/resolution of change anomalies not consistently documented.',
    keyIssues: [
      'Incomplete population of tracked configuration changes',
      'No consistent monitoring of production changes for unauthorized/inappropriate activity',
      'Documentation gaps on anomaly investigation and resolution',
    ],
    recommendation: 'Validate a complete and accurate population of configuration changes; document policies/procedures for production-change monitoring, review, investigation, and remediation.',
    fy25Status: 'Formal change-management and testing process developed. GCSS-MC established policies/procedures tracking the end-to-end change lifecycle, documents and maintains a change inventory, formally routes changes through a review board, and risk-rates/tests each change.',
    leverage: 'Largely closed at the process level for GCSS-MC in FY2025 — a template for the remaining systems and for other Services.',
    dollarExposure: null,
  },
  {
    num: 7,
    name: 'Financial Information Systems – IT Operations',
    nature: 'IT General Controls' as MWNature,
    rootCause: 'No effective controls to track and remediate interface/job-processing errors; scheduled/automated jobs not formally documented; no established process to capture and log transactional interface transmission errors.',
    keyIssues: [
      'Lack of tracked remediation for identified interface/job errors',
      'No formal documentation of scheduled/automated jobs',
      'No logging process for interface transmission errors',
    ],
    recommendation: 'Retain evidence of scheduled-job monitoring and successful completion; design a transaction-level interface error-handling process (identification, logging, monitoring, remediation).',
    fy25Status: 'GCSS-MC built an Error Handling Framework (EHF) for daily/weekly error controls with real-time capture/logging, plus an Automated Interface Report tracking active/inactive status of all inbound/outbound interfaces. A permanent DAI Interface Team gives full visibility into the 27 incoming interfaces feeding the general ledger, with a formal error guide for rapid triage.',
    leverage: 'This is the USMC playbook\'s most Advana-adjacent, most portable win — interface error clustering and dedicated interface ownership, directly analogous to the DoD-wide "Qlik obligation-interface analytics" capability.',
    dollarExposure: null,
  },
]

// ------------------------------------------------------------------
// NONCOMPLIANCE — FFMIA and FMFIA (unresolved alongside the clean opinion)
// ------------------------------------------------------------------
export const USMC_NONCOMPLIANCE = [
  {
    law: 'Federal Financial Management Improvement Act (FFMIA)',
    detail: 'USMC financial management systems do not substantially comply with federal financial management system requirements, applicable federal accounting standards, or USSGL posting logic at the transaction level. Same root causes as the three IT General Controls material weaknesses (access, configuration, IT operations).',
  },
  {
    law: "Federal Managers' Financial Integrity Act (FMFIA)",
    detail: 'USMC did not consistently perform design or operating-effectiveness testing across the five GAO Green Book components — the same finding underlying the Oversight and Monitoring material weakness.',
  },
]

// ------------------------------------------------------------------
// WHAT USMC DID RIGHT — the mitigation/compensating-control playbook
// tier: 1 = governance/enabler, 2 = highest-leverage mechanical fix,
//       3 = highest dollar materiality (least durable), 4 = baseline hygiene / soft factors
// ------------------------------------------------------------------
export const USMC_WINS = [
  {
    win: 'Stood up a dedicated RMIC governance structure in FY2025',
    detail: 'A named governance body — not an ad hoc committee — owns audit and Risk Management & Internal Control activities. Marine Corps Order 5200.24F was revised and signed by the Commandant, reinforcing top-level ownership.',
    portable: true,
    tier: 1,
  },
  {
    win: 'Stood up a Systems and Data Integration division specifically for transactional analysis',
    detail: 'A standing unit (operational all of FY2025) whose sole mission is monitoring interfaces and building efficiencies in transactional processes — not a project team that disbands after the fix. This is the organizational home that made the interface fix (below) possible and durable.',
    portable: true,
    tier: 1,
  },
  {
    win: 'Built dedicated interface ownership: the DAI Interface Team + Error Handling Framework',
    detail: 'Full visibility into all 27 incoming interfaces feeding the general ledger, a formal error guide, and real-time error capture/logging via the Error Handling Framework (EHF) plus an Automated Interface Report tracking active/inactive status. This directly parallels the DoD-wide Qlik obligation-interface analytics used in the original FY2024 breakthrough — the same mechanism shows up in both the first clean opinion and the sustained second one.',
    portable: true,
    tier: 2,
  },
  {
    win: 'Sequenced ICAM modernization on a funded, dated rollout (NIS/DON ICAM, DISA E-ICAM)',
    detail: 'Access control and SoD remediation is on rails — GCSS-MC onboarded in FY2025, DAI scheduled for FY2026 — rather than an open-ended "someday" IT modernization backlog item.',
    portable: true,
    tier: 2,
  },
  {
    win: 'Accepted labor-intensive manual compensating controls rather than waiting for system fixes',
    detail: 'Excel-based tracking for $5.5B of Military Equipment and $3.0B of construction-in-progress is not sustainable long-term, but it produced auditable evidence now for the single largest asset category (GPP&E, 48.3% of total assets). USMC treated "good enough evidence today" as compatible with "keep building the real system fix" — but the auditor names this same workaround as inherent risk in the same report.',
    portable: true,
    tier: 3,
  },
  {
    win: 'Maintained a genuinely low-risk payment/compliance baseline',
    detail: 'Zero reportable Antideficiency Act violations in FY2025; 1.98% combined improper/unknown payment rate under PIIA. Clean opinion is easier to sustain when the "easy to get very wrong" categories are already under control.',
    portable: true,
    tier: 4,
  },
  {
    win: 'Kept the EY relationship constructive and continuous, not adversarial',
    detail: 'The Fiscal Director\'s response letter explicitly credits the "positive and professional relationship" as "a key factor in the successful completion" of the audit — a soft factor that shows up in evidence-request cycle time and CAP quality.',
    portable: true,
    tier: 4,
  },
  {
    win: 'Started automation pilots on the narrowest, most tractable slice first',
    detail: 'Rather than a department-wide AI transformation program, USMC piloted automation on one interface (contract writing system) to prove the triage/labor-hour-refocus pattern before scaling.',
    portable: true,
    tier: 4,
  },
]

// ------------------------------------------------------------------
// MATERIALITY BREAKDOWN — where the $52B in total assets actually sits
// (Figure 9, FY2025 USMC AFR)
// ------------------------------------------------------------------
export const MATERIALITY_BREAKDOWN = [
  { label: 'General PP&E, Net', valueB: 25.1, pct: 48.3, note: '$8.5B of this ($5.5B military equipment + $3.0B construction-in-progress) is tracked via Excel workbooks, not a system of record.' },
  { label: 'FBWT + Inventory & Related Property, Net', valueB: 26.8, pct: 51.5, note: 'Combined per AFR Figure 9. OM&S portion (~7,000 NSNs) valued via weighted-average-cost Excel calculation.' },
  { label: 'Remaining assets (AR, advances/prepayments)', valueB: 0.1, pct: 0.2, note: 'Residual balance — immaterial by comparison.' },
]

// ------------------------------------------------------------------
// THE INTERFACE CHOKEPOINT — why interface monitoring punches above
// its weight relative to any single balance-sheet line
// ------------------------------------------------------------------
export const INTERFACE_CHOKEPOINT = {
  incomingInterfaces: 27,
  mwsConverging: [
    'Budget Execution & Monitoring (MW 2) — unmatched transactions, dormant obligations flow through these interfaces',
    'Financial Info Systems – Access Controls/SoD (MW 5) — governs who can touch the interfaces',
    'Financial Info Systems – Configuration Management (MW 6) — governs changes to the interfaces',
    'Financial Info Systems – IT Operations (MW 7) — is the interface error-handling itself',
  ],
  cutoffRiskDetail: 'DAI enforces a strict period-end cutoff. Interface files that arrive late are not systemically recorded — USMC must manually track and post them as temporary journal vouchers, which the auditor flags as directly increasing the risk of material misstatement at every close. Cutoff is one of five classic audit assertions (existence, completeness, valuation, rights, cutoff), and a broken interface is the one failure mode that can misstate timing across every transaction cycle simultaneously — not just one balance.',
  statementAffected: 'Statement of Budgetary Resources — one of the three principal statements EY opined on, and the one most directly dependent on interface integrity rather than asset valuation.',
}

// ------------------------------------------------------------------
// CRITICALITY HIERARCHY — ranking what mattered most, and why
// ------------------------------------------------------------------
export const CRITICALITY_HIERARCHY = [
  {
    tier: 1,
    label: 'Governance — the enabler',
    verdict: 'Necessary, not sufficient',
    items: ['Commandant-signed RMIC order (MCO 5200.24F)', 'Standing Systems and Data Integration division'],
    rationale: 'Nothing else on this list gets built or stays funded without a senior-leader decision to prioritize audit readiness and a standing organizational home to own it. The Systems and Data Integration division is precisely what gave the interface fix (tier 2) a permanent owner instead of a project team that disbands after one good year.',
    caveat: 'Governance alone produces no audit evidence. It is the precondition for the other tiers, not a substitute for them — USMC could have a perfect RMIC program and still fail the audit if the interfaces or the balance-sheet evidence weren\'t there.',
  },
  {
    tier: 2,
    label: 'Interface monitoring — the highest-leverage mechanical fix',
    verdict: 'Most critical of the tactical fixes',
    items: ['DAI Interface Team (full visibility into 27 incoming interfaces)', 'Error Handling Framework + Automated Interface Report', 'ICAM sequencing for access to those same systems'],
    rationale: 'Every dollar of the $40.5B appropriation base has to pass through one of 27 interfaces before it becomes an audited number — this is the chokepoint, not a single asset class. It is also the one fix credited in both the FY2024 breakthrough (Qlik interface analytics) and the FY2025 sustained opinion, and it converges with four of the seven material weaknesses. It directly addresses cutoff risk, the one failure mode that can misstate an entire transaction cycle rather than one balance.',
    caveat: 'Interface integrity alone does not cover GPP&E/OM&S valuation risk (tier 3) — a perfectly reconciled interface can still carry a misvalued $25B GPP&E balance behind it.',
  },
  {
    tier: 3,
    label: 'GPP&E/OM&S compensating controls — highest dollar materiality',
    verdict: 'Biggest number, least durable',
    items: ['Excel-based Military Equipment tracking ($5.5B)', 'Excel-based construction-in-progress tracking ($3.0B)', 'Weighted-average-cost OM&S calculation'],
    rationale: 'GPP&E alone is 48.3% of total assets — the single largest balance-sheet category, and the one whose evidence trail is the most directly manual. Without these workbooks, the largest line on the balance sheet has no audit trail at all.',
    caveat: 'This is a stopgap the auditor itself names as inherent risk in the same report — labor-intensive, dependent on a few experienced people, and explicitly called out as something USMC is trying to engineer its way out of (the FY2025 PP&E/OM&S automation study), not settle into.',
  },
]

// ------------------------------------------------------------------
// SCALE COMPARISON — why "just copy USMC" is harder than it sounds
// ------------------------------------------------------------------
export const SCALE_COMPARISON = [
  { entity: 'USMC General Fund',   totalAssetsB: 52,    appropriationsB: 40.5, opinion: 'Unmodified (2 yrs)', color: 'green' },
  { entity: 'Navy General Fund',   totalAssetsB: 380,   appropriationsB: 230,  opinion: 'Disclaimer', color: 'coral' },
  { entity: 'Army General Fund',   totalAssetsB: 420,   appropriationsB: 250,  opinion: 'Disclaimer', color: 'coral' },
  { entity: 'Air Force General Fund', totalAssetsB: 350, appropriationsB: 220, opinion: 'Disclaimer', color: 'coral' },
]
// Note: Navy/Army/Air Force figures are order-of-magnitude estimates for scale contrast
// (each ~7-10x USMC's asset base), consistent with relative force-structure size; DODIG-2026-032
// does not break out entity-level total assets, only the aggregate 43%/64% disclaimer coverage.

// ------------------------------------------------------------------
// DoD-WIDE RECOMMENDATIONS — grouped by category
// ------------------------------------------------------------------
export const DOD_RECOMMENDATIONS = [
  {
    category: 'Governance',
    title: 'Mandate a USMC-style RMIC governance body at every disclaimed entity, with Secretary/Commandant-level sign-off',
    detail: 'The single clearest USMC differentiator is that internal control ownership sits with senior line leadership (Commandant-signed MCO, Fiscal Director LtGen response letter), not buried in a compliance office. Army, Navy, and Air Force General Funds should each stand up an equivalent named body within FY2026, with quarterly reporting to the Service Secretary — mirroring the 45-day DepSec cadence already imposed on CDAO/Advana.',
    priority: 'Immediate (FY26)',
  },
  {
    category: 'Evidence strategy',
    title: 'Decouple "get to unmodified opinion" from "close all material weaknesses" as separate, sequenced goals',
    detail: 'USMC\'s own experience — 2 consecutive clean opinions with 0 MWs resolved — proves these are different problems with different timelines. DoD leadership should stop implying FY28 requires zero material weaknesses; it requires sufficient, well-documented audit evidence (including manual compensating controls) that the statements are not materially misstated. This reframing changes what "on track for FY28" should even measure.',
    priority: 'Immediate (FY26)',
  },
  {
    category: 'Interface remediation',
    title: 'Stand up a dedicated Interface Team + Error Handling Framework at every Component feeding a shared general ledger system',
    detail: 'USMC\'s DAI Interface Team (full visibility into 27 incoming interfaces) is the most mechanically portable win in this report — it is process and staffing, not a multi-year IT program. Combined with the DoD-wide Qlik obligation-interface analytics already used in the original USMC breakthrough, this should be the first thing replicated at Army and Navy.',
    priority: 'Immediate (FY26)',
  },
  {
    category: 'Compensating controls',
    title: 'Formalize (don\'t just tolerate) manual compensating controls as a bridge strategy, with an explicit sunset date',
    detail: 'The GPP&E/OM&S Excel workbooks are simultaneously how USMC produced auditable evidence and a named inherent risk in the auditor\'s own report. DoD should require every Component using manual workarounds to document them as formal compensating controls with defined review/retention standards now, paired with a funded automation timeline (USMC\'s own PP&E/OM&S study is a template) — so the bridge doesn\'t become the permanent structure.',
    priority: '6-month',
  },
  {
    category: 'Access & identity',
    title: 'Accelerate DON ICAM / DISA Enterprise ICAM onboarding across all Components on a published, dated schedule',
    detail: 'Access Controls/SoD is the material weakness with the clearest funded technical path in the USMC report (NIS ICAM). The other Services should be held to the same GCSS-MC-style schedule (onboard core financial/logistics systems in FY26, legacy interfaces by FY27) rather than an open-ended modernization backlog.',
    priority: '6-month',
  },
  {
    category: 'Sequencing strategy',
    title: 'Pick the next domino deliberately — don\'t attempt Army, Navy, and Air Force simultaneously',
    detail: 'USMC succeeded in part because its General Fund is the smallest of the four (roughly one-seventh to one-eighth the asset base of Army or Navy). DoD should identify which of the remaining 10 disclaimed entities is most USMC-like in scale and complexity (likely a smaller Working Capital Fund or 4th Estate agency, not Army General Fund) and target it explicitly as the next proof point, rather than diffusing remediation effort evenly across all of them.',
    priority: '12-month',
  },
  {
    category: 'DoD-level blockers',
    title: 'Treat JSF Global Spares Pool and Building Partner Capacity as their own critical path, independent of Component progress',
    detail: 'Even a hypothetical scenario where every Component reaches an unmodified opinion does not clear the DoD-wide agency opinion while the $2T JSF life-cycle unquantifiable misstatement and the $18.9B Building Partner Capacity misstatement remain open. These need named executive owners and their own milestone tracking, not a rider on the Component remediation roadmap.',
    priority: 'Immediate (FY26)',
  },
  {
    category: 'Reporting integrity',
    title: 'Report Component-level MW inventories (new/resolved/carried-forward) in every public FY28 status update, not just opinion type',
    detail: 'The most informative single data point in the USMC AFR is Table 1: 7 MWs, 0 new, 0 resolved. That "velocity" number is what tells you whether an opinion is durable or lucky. DoD-wide FY28 progress reporting should surface this metric for every Component every year, not just at final opinion time.',
    priority: '6-month',
  },
]

// ------------------------------------------------------------------
// RISK REGISTER — assessing current DoD strategy against USMC evidence
// ------------------------------------------------------------------
export const USMC_INFORMED_RISKS = [
  {
    severity: 'high',
    risk: 'FY28 "agency-wide" framing conflates opinion with remediation completeness',
    detail: 'If DoD leadership (or Congress) expects FY28 clean opinion to mean the 26 MWs are substantially resolved, USMC\'s own 0-resolved-in-2-years track record shows that expectation is not supported by the pattern observed at the one Component that has already succeeded.',
    likelihood: 'Likely without a reporting fix',
  },
  {
    severity: 'high',
    risk: 'Nonlinear scaling — Army/Navy/AF are not "USMC but bigger," they are structurally more complex',
    detail: 'USMC is a single Service with comparatively few APSRs and a contained interface count (27 into the general ledger). Army and Navy General Funds carry multiples more trading partners, legacy systems, and Service Providers. Linear extrapolation from USMC\'s 2-year timeline likely understates the effort by more than the ~7-10x asset ratio alone.',
    likelihood: 'High',
  },
  {
    severity: 'medium',
    risk: 'Manual compensating controls (the USMC bridge strategy) don\'t scale to larger asset bases without proportional labor growth',
    detail: 'A $5.5B ME Excel workbook is labor-intensive but tractable for USMC; Army\'s general equipment and real property portfolios are large multiples of that. Replicating the "Excel bridge" approach at Army/Navy scale risks becoming its own new material weakness (documentation completeness, version control, human error) rather than a fix.',
    likelihood: 'Medium-high',
  },
  {
    severity: 'medium',
    risk: 'ICAM rollout timing risk — DAI\'s DISA E-ICAM onboarding is scheduled, not complete',
    detail: 'USMC\'s own Access Controls MW explicitly calls FY2026 "pivotal" for closing NIS ICAM gaps. If Army/Navy DAI-equivalent systems are earlier in their ICAM journeys, their Access Control MWs are further from resolution than USMC\'s, even before considering scale.',
    likelihood: 'Medium',
  },
  {
    severity: 'medium',
    risk: 'DoD-level misstatements (JSF, BPC) are independent of Component remediation and currently unresolved',
    detail: 'These blockers don\'t care how many Components reach unmodified opinions — they sit above the Component layer. No amount of USMC-style replication fixes them; they need separate executive ownership and their own timeline.',
    likelihood: 'Confirmed open as of FY2025',
  },
  {
    severity: 'low',
    risk: 'Positive signal: durability is real, not a fluke',
    detail: 'Two consecutive unmodified opinions, with the auditor citing the same 7 MWs and no new ones, is meaningfully different from a single-year clean opinion that could be reporting noise. This is genuine evidence the FY28 goal is achievable at Component scale — the open question is replication speed and DoD-level blockers, not whether Component-level clean opinions are real.',
    likelihood: 'Confirmed positive',
  },
]

// ------------------------------------------------------------------
// LIKELIHOOD ASSESSMENT — by milestone
// ------------------------------------------------------------------
export const LIKELIHOOD_ASSESSMENT = [
  {
    milestone: 'FY27 DWCF combined clean opinion',
    likelihood: 'Moderate',
    rationale: 'Smaller perimeter than agency-wide, Navy DWCF already has some clean-opinion precedent, and the underlying problems (buy/sell reconciliation, rate-setting) are exactly what Advana\'s Seller Elimination Workbooks and UoT engine were built for. USMC\'s pattern is closer to this scale than to Army General Fund scale.',
  },
  {
    milestone: 'FY28 agency-wide unmodified opinion — all 11 disclaimed entities clear',
    likelihood: 'Low-to-moderate',
    rationale: 'Requires Army, Navy, and Air Force General Funds — each several multiples of USMC\'s scale — to replicate in ~2-2.5 years a result USMC has so far sustained for 2 years without resolving a single underlying material weakness. Even generous replication assumptions put full agency-wide clearance at risk without more aggressive sequencing and resourcing than currently disclosed.',
  },
  {
    milestone: 'FY28 agency-wide opinion clearing DoD-level misstatements (JSF, BPC)',
    likelihood: 'Uncertain — depends on separate workstreams',
    rationale: 'Not addressed by Component-level replication at all. JSF Global Spares Pool integration into an accountable property system and correcting Building Partner Capacity accounting are named 90-day/12-month actionable items in the DoD-wide roadmap, but neither has USMC-style evidence of being on a proven remediation path yet.',
  },
]
