import type { Skill } from '@/lib/types'

export const BUDGET_ANALYSIS_SKILL: Skill = {
  id: 'budget_analysis_insider',
  name: 'Insider budget analysis',
  category: 'budget',
  description: 'Senior GS-15 grade budget analysis for career federal professionals.',
  systemPrompt: `BUDGET ANALYSIS SKILL — key rules:
- Audience: GS-14/15 portfolio manager, no definitional preamble needed
- Structure: (1) Topline & architecture, (2) Appropriation-title breakdown, (3) Major program deltas, (4) Force structure, (5) Reform/savings realism, (6) Execution risk
- Cite PE/BLI numbers and dollar deltas when source supports it
- Anchor year-over-year comparisons to prior-year enacted, not request
- Lead with analytical point, then supporting data
- Mark inferences explicitly; never invent numbers`,
  tools: ['retrieve_chunks', 'web_search', 'generate_chart'],
}

export const AUDIT_REPORT_SKILL: Skill = {
  id: 'audit_report_analysis',
  name: 'Audit and IG report analysis',
  category: 'audit',
  description: 'Analyze GAO, IG, and A-123 work. Track material weaknesses and CAPs.',
  systemPrompt: `AUDIT SKILL — key rules:
- Audience: audit liaison, OIG staff, CFO deputy
- Structure: (1) Scope, (2) Opinion type, (3) Findings numbered with status, (4) CAP milestones, (5) Trend/repeat findings, (6) Next-cycle readiness
- Cite GAGAS, FMFIA, FFMIA, A-123, FISMA when relevant
- Never soften material weaknesses; flag repeat findings explicitly`,
  tools: ['retrieve_chunks', 'web_search', 'generate_chart'],
}

export const ACCOUNTING_DATA_SKILL: Skill = {
  id: 'accounting_financial_data',
  name: 'Accounting and financial data analysis',
  category: 'accounting',
  description: 'Obligation, outlay, ULO, and USSGL-level analysis.',
  systemPrompt: `ACCOUNTING SKILL — key rules:
- Audience: budget execution analyst, DFO, accountant
- Distinguish: BA vs obligations vs outlays vs expenditures
- Flag aging ULOs, expiring-year risk, ADA exposure
- Reference USSGL account numbers when citing transactions
- SF-133/SF-132 reconciliation issues: flag root cause, not just variance`,
  tools: ['retrieve_chunks', 'generate_chart'],
}

export const CONTRACT_ANALYSIS_SKILL: Skill = {
  id: 'contract_analysis',
  name: 'Contract and acquisition analysis',
  category: 'contracts',
  description: 'FAR/DFARS-aware cost proposal and performance review.',
  systemPrompt: `CONTRACT SKILL — key rules:
- Audience: contracting officer, cost analyst, program manager
- Always cite FAR/DFARS clauses by number
- Distinguish contract types: FFP, CPFF, CPAF, T&M — and their risk implications
- EVM analysis: CV, SV, EAC, ETC — flag breach thresholds
- Competition: distinguish full-and-open vs sole-source; cite FAR 6.302 if sole-source`,
  tools: ['retrieve_chunks', 'web_search', 'generate_chart'],
}

export const DASHBOARD_SKILL: Skill = {
  id: 'dashboard_generation',
  name: 'Dashboard and chart generation',
  category: 'budget',
  description: 'Generate Recharts-ready data visualizations.',
  systemPrompt: `DASHBOARD SKILL — key rules:
- Use generate_chart tool for all visualizations
- Prefer horizontal bars for ranked program lists; line charts for time-series; stacked bars for appropriation breakdowns
- Always include dollar units on axis labels
- Keep chart titles descriptive enough to stand alone`,
  tools: ['retrieve_chunks', 'generate_chart'],
}

export const STANDARD_REPORT_SKILL: Skill = {
  id: 'standard_report',
  name: 'Standard federal report generation',
  category: 'budget',
  description: 'Produce structured deliverable reports.',
  systemPrompt: `REPORT SKILL — key rules:
- Use generate_report tool to save finalized outputs
- Federal report structure: executive summary → findings → analysis → recommendations → appendices
- Include a "Source documents" section citing what was retrieved
- Flag low-confidence sections explicitly`,
  tools: ['retrieve_chunks', 'generate_report'],
}

export const ALL_SKILLS = [
  BUDGET_ANALYSIS_SKILL,
  AUDIT_REPORT_SKILL,
  ACCOUNTING_DATA_SKILL,
  CONTRACT_ANALYSIS_SKILL,
  DASHBOARD_SKILL,
  STANDARD_REPORT_SKILL,
]

export function getSkillsForCategory(category: string): Skill[] {
  return ALL_SKILLS.filter((s) => s.category === category || s.category === 'budget')
}
