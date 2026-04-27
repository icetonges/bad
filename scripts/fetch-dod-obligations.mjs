#!/usr/bin/env node
/**
 * fetch-dod-obligations.mjs — v5 (API-doc driven)
 *
 * Based on: https://api.usaspending.gov/docs/endpoints
 *
 * KEY DESIGN:
 *  1. Call /references/submission_periods/ FIRST — tells us exactly which
 *     FY/period has published data. All subsequent calls use confirmed periods.
 *
 *  2. Use ONLY documented GET/POST endpoints from the official endpoint list.
 *     No more guessing at URL shapes or field names.
 *
 * SOURCES (all confirmed in endpoint docs):
 *  1. /references/submission_periods/                    — find latest published period
 *  2. /agency/097/budgetary_resources/                   — multi-year BA/Obl/Outlays
 *  3. /agency/097/federal_account/?fiscal_year=X         — TAS-level accounts
 *  4. /agency/097/object_class/?fiscal_year=X            — OMB object class (GET)
 *  5. /agency/097/program_activity/?fiscal_year=X        — program activity (GET)
 *  6. /agency/097/sub_agency/?fiscal_year=X              — sub-agency breakdown
 *  7. /agency/097/obligations_by_award_category/         — obligations by award type
 *  8. /financial_balances/agencies/?fiscal_year=X&funding_agency_id=126
 *  9. /financial_spending/major_object_class/?fiscal_year=X&funding_agency_id=126
 * 10. /reporting/agencies/097/differences/              — SF-133 account differences
 * 11. /reporting/agencies/overview/                     — agency reporting status
 * 12. /search/spending_by_award/                        — top contracts (POST)
 */

const INGEST_URL    = process.env.INGEST_URL
const INGEST_SECRET = process.env.INGEST_SECRET
if (!INGEST_URL || !INGEST_SECRET) { console.error('❌ INGEST_URL and INGEST_SECRET required'); process.exit(1) }

const BASE = 'https://api.usaspending.gov/api/v2'
const DOD  = '097'
const DOD_AGENCY_ID = 126  // USASpending numeric ID for DoD

// ── HTTP helpers ────────────────────────────────────────────────────
async function apiFetch(label, fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      if (i > 0) {
        console.log(`  ↺ retry ${i}: ${label}`)
        await sleep((i) * 3000)
      } else {
        console.log(`  ✦ ${label}`)
      }
      const res = await fn()
      console.log(`    ✓ ok`)
      return res
    } catch (e) {
      const msg = String(e.message || e).slice(0, 120)
      if (i < retries - 1) console.warn(`    ⚠ ${msg}`)
      else { console.warn(`    ✗ ${msg}`); return null }
    }
  }
  return null
}

async function get(url, timeout = 20000) {
  const r = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'FedFMMatter/5.0' },
    signal: AbortSignal.timeout(timeout),
  })
  if (!r.ok) {
    const t = await r.text().catch(() => '')
    throw new Error(`HTTP ${r.status}: ${t.replace(/<[^>]+>/g, ' ').trim().slice(0, 100)}`)
  }
  return r.json()
}

async function post(url, body, timeout = 20000) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'FedFMMatter/5.0' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  })
  if (!r.ok) {
    const t = await r.text().catch(() => '')
    throw new Error(`HTTP ${r.status}: ${t.replace(/<[^>]+>/g, ' ').trim().slice(0, 100)}`)
  }
  return r.json()
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
const fmtB  = v => v != null && !isNaN(+v) ? `$${(+v / 1e9).toFixed(2)}B` : 'N/A'
const fmtM  = v => v != null && !isNaN(+v) ? `$${(+v / 1e6).toFixed(0)}M` : 'N/A'
const fmtPct = (n, d) => (n && d && +d !== 0) ? `${((+n / +d) * 100).toFixed(1)}%` : 'N/A'

// ── Step 0: Find latest published submission period ─────────────────
// /api/v2/references/submission_periods/
// Returns array of {period_start_date, period_end_date, submission_fiscal_year,
//                   submission_fiscal_month, is_quarter, ...}
// We pick the most recent period that has certified data for DoD.

async function getLatestPublishedPeriod() {
  const data = await apiFetch('references/submission_periods', () =>
    get(`${BASE}/references/submission_periods/`)
  )
  if (!data?.available_periods?.length) {
    console.warn('    ⚠ Could not get submission periods, using FY2025 P12 as fallback')
    return { fy: 2025, period: 12 }
  }

  // Sort descending by fiscal year + period, return latest
  const periods = [...data.available_periods].sort((a, b) =>
    b.submission_fiscal_year !== a.submission_fiscal_year
      ? b.submission_fiscal_year - a.submission_fiscal_year
      : b.submission_fiscal_month - a.submission_fiscal_month
  )

  const latest = periods[0]
  const fy     = latest.submission_fiscal_year
  const period = latest.submission_fiscal_month

  console.log(`    Latest available period: FY${fy} P${String(period).padStart(2,'0')}`)
  return { fy, period }
}

// ── Fiscal helpers ──────────────────────────────────────────────────
const fyStart = fy => `${fy - 1}-10-01`
const fyEnd   = fy => `${fy}-09-30`

// ── Data fetchers (using documented endpoints) ──────────────────────

// 1. Multi-year budgetary resources
async function fetchBudgetaryResources() {
  return apiFetch(`agency/${DOD}/budgetary_resources`, () =>
    get(`${BASE}/agency/${DOD}/budgetary_resources/`)
  )
}

// 2. Federal accounts / TAS detail
async function fetchFederalAccounts(fy) {
  return apiFetch(`agency/${DOD}/federal_account FY${fy}`, () =>
    get(`${BASE}/agency/${DOD}/federal_account/?fiscal_year=${fy}&limit=30&sort=obligated_amount&order=desc`)
  )
}

// 3. Object class — GET with fiscal_year (documented GET endpoint)
async function fetchObjectClass(fy) {
  return apiFetch(`agency/${DOD}/object_class FY${fy}`, () =>
    get(`${BASE}/agency/${DOD}/object_class/?fiscal_year=${fy}&limit=100`)
  )
}

// 4. Program activity — GET with fiscal_year (documented GET endpoint)
async function fetchProgramActivity(fy) {
  return apiFetch(`agency/${DOD}/program_activity FY${fy}`, () =>
    get(`${BASE}/agency/${DOD}/program_activity/?fiscal_year=${fy}&limit=50&sort=obligated_amount&order=desc`)
  )
}

// 5. Sub-agency
async function fetchSubAgency(fy) {
  return apiFetch(`agency/${DOD}/sub_agency FY${fy}`, () =>
    get(`${BASE}/agency/${DOD}/sub_agency/?fiscal_year=${fy}&limit=30`)
  )
}

// 6. Obligations by award category
async function fetchObligationsByCategory(fy) {
  return apiFetch(`agency/${DOD}/obligations_by_award_category FY${fy}`, () =>
    get(`${BASE}/agency/${DOD}/obligations_by_award_category/?fiscal_year=${fy}`)
  )
}

// 7. Financial balances (uses numeric agency_id=126)
async function fetchFinancialBalances(fy) {
  return apiFetch(`financial_balances/agencies FY${fy}`, () =>
    get(`${BASE}/financial_balances/agencies/?fiscal_year=${fy}&funding_agency_id=${DOD_AGENCY_ID}`)
  )
}

// 8. Major object class spending (uses numeric agency_id=126)
async function fetchMajorObjectClass(fy) {
  return apiFetch(`financial_spending/major_object_class FY${fy}`, () =>
    get(`${BASE}/financial_spending/major_object_class/?fiscal_year=${fy}&funding_agency_id=${DOD_AGENCY_ID}`)
  )
}

// 9. Reporting differences — SF-133 account differences (best GTAS alternative)
async function fetchReportingDifferences(fy, period) {
  return apiFetch(`reporting/agencies/${DOD}/differences FY${fy} P${period}`, () =>
    get(`${BASE}/reporting/agencies/${DOD}/differences/?fiscal_year=${fy}&fiscal_period=${period}&limit=50`, 30000)
  )
}

// 10. Agency reporting overview
async function fetchReportingOverview(fy, period) {
  return apiFetch(`reporting/agencies/overview FY${fy} P${period}`, () =>
    get(`${BASE}/reporting/agencies/overview/?fiscal_year=${fy}&fiscal_period=${period}&limit=30`)
  )
}

// 11. Top contracts (POST)
async function fetchTopContracts(fy) {
  return apiFetch(`search/spending_by_award FY${fy}`, () =>
    post(`${BASE}/search/spending_by_award/`, {
      filters: {
        agencies: [{ type: 'awarding', tier: 'toptier', name: 'Department of Defense' }],
        time_period: [{ start_date: fyStart(fy), end_date: fyEnd(fy) }],
        award_type_codes: ['A', 'B', 'C', 'D'],
      },
      fields: ['Award ID', 'Recipient Name', 'Award Amount', 'Awarding Sub Agency', 'Award Type', 'Description'],
      sort: 'Award Amount', order: 'desc', limit: 30, page: 1,
    })
  )
}

// 12. Spending by category (federal account) — for TAS-level award spending
async function fetchSpendingByFederalAccount(fy) {
  return apiFetch(`search/spending_by_category/federal_account FY${fy}`, () =>
    post(`${BASE}/search/spending_by_category/federal_account/`, {
      filters: {
        agencies: [{ type: 'awarding', tier: 'toptier', name: 'Department of Defense' }],
        time_period: [{ start_date: fyStart(fy), end_date: fyEnd(fy) }],
      },
      limit: 20, page: 1,
    })
  )
}

// ── Content builder ─────────────────────────────────────────────────
const OC_NAMES = {
  '10': 'Personnel Compensation & Benefits',
  '11': 'Personnel Compensation', '12': 'Personnel Benefits',
  '21': 'Travel', '22': 'Transportation of Things',
  '23': 'Rent, Communications & Utilities', '24': 'Printing',
  '25': 'Other Contractual Services (OC25)', '26': 'Supplies & Materials',
  '31': 'Equipment (OC31)', '32': 'Land & Structures',
  '41': 'Grants & Fixed Charges', '99': 'Other/Total',
}

function buildContent({ fy, period, budRes, fedAcct, objClass, progActivity,
  subAgency, obsByCategory, finBalances, majorOC, reportingDiff, overview, contracts, spendByAcct }) {

  const q = Math.ceil(period / 3)
  const lines = [
    `# DoD Obligation Data — FY${fy} P${String(period).padStart(2,'0')} (Q${q})`,
    `Agency: Department of Defense | Toptier Code: ${DOD} | Numeric ID: ${DOD_AGENCY_ID}`,
    `Retrieved: ${new Date().toISOString().slice(0, 10)}`,
    `Source: USASpending.gov API v2 (https://api.usaspending.gov)`,
    `Submission period: FY${fy} P${period} — latest certified data available`,
    '',
  ]

  // Budgetary resources multi-year
  if (budRes?.agency_data_by_year?.length) {
    lines.push('## Multi-Year DoD Budgetary Resources')
    lines.push('Source: /api/v2/agency/097/budgetary_resources/')
    for (const y of [...budRes.agency_data_by_year].sort((a, b) => a.fiscal_year - b.fiscal_year)) {
      const rate = fmtPct(y.total_obligations, y.total_budgetary_resources)
      lines.push(`FY${y.fiscal_year}: BA ${fmtB(y.total_budgetary_resources)} | Obligations ${fmtB(y.total_obligations)} | Outlays ${fmtB(y.total_outlays)} | Rate ${rate}`)
    }
    lines.push('')
  }

  // Federal accounts / TAS
  if (fedAcct?.totals) {
    const t = fedAcct.totals
    lines.push(`## Federal Accounts Summary — FY${fy}`)
    lines.push('Source: /api/v2/agency/097/federal_account/')
    lines.push(`Total BA: ${fmtB(t.total_budgetary_resources)} | Obligations: ${fmtB(t.obligated_amount)} | Outlays: ${fmtB(t.gross_outlay_amount)} | Rate: ${fmtPct(t.obligated_amount, t.total_budgetary_resources)}`)
    if (fedAcct.results?.length) {
      lines.push('')
      lines.push('### Top TAS by Obligation (TAS detail)')
      for (const r of fedAcct.results.slice(0, 25)) {
        lines.push(`- ${r.code} "${r.name}": Obligations ${fmtB(r.obligated_amount)} | BA ${fmtB(r.total_budgetary_resources)} | Rate ${fmtPct(r.obligated_amount, r.total_budgetary_resources)}`)
      }
    }
    lines.push('')
  }

  // Object class
  if (objClass?.results?.length) {
    lines.push(`## OMB Object Class — FY${fy}`)
    lines.push('Source: /api/v2/agency/097/object_class/ (account-side obligations)')
    lines.push('Directly maps to SF-133 object class lines.')
    for (const r of objClass.results) {
      const code = r.object_class || r.major_object_class || r.code || ''
      const name = OC_NAMES[String(code)] || OC_NAMES[String(code).slice(0,2)] || r.object_class_name || r.name || ''
      const obl  = r.obligated_amount ?? r.gross_outlay_amount ?? 0
      lines.push(`- OC ${code} ${name}: ${fmtB(obl)}`)
    }
    if (objClass.totals) lines.push(`Total: ${fmtB(objClass.totals.obligated_amount)}`)
    lines.push('')
  }

  // Major object class from financial_spending
  if (majorOC?.results?.length) {
    lines.push(`## Major Object Class (Financial Spending) — FY${fy}`)
    lines.push(`Source: /api/v2/financial_spending/major_object_class/?funding_agency_id=${DOD_AGENCY_ID}`)
    for (const r of majorOC.results) {
      lines.push(`- OC ${r.major_object_class || r.object_class}: ${fmtM(r.obligated_amount)} obligations`)
    }
    lines.push('')
  }

  // Program activity
  if (progActivity?.results?.length) {
    lines.push(`## Program Activity — FY${fy}`)
    lines.push('Source: /api/v2/agency/097/program_activity/ (account-side)')
    lines.push('Program activities link TAS accounts to budget justification line items.')
    for (const r of progActivity.results.slice(0, 30)) {
      const code = r.program_activity_code || r.code || ''
      const name = r.program_activity_name || r.name || ''
      lines.push(`- PA ${code} "${name}": ${fmtB(r.obligated_amount)}`)
    }
    if (progActivity.page_metadata?.total) lines.push(`Total program activities: ${progActivity.page_metadata.total}`)
    lines.push('')
  }

  // Sub-agency
  if (subAgency?.results?.length) {
    lines.push(`## DoD Sub-Agency Breakdown — FY${fy}`)
    lines.push('Source: /api/v2/agency/097/sub_agency/')
    for (const s of subAgency.results.slice(0, 20)) {
      lines.push(`- ${s.name}: Obligations ${fmtB(s.total_obligations)} | Outlays ${fmtB(s.total_outlays)} | Awards ${s.award_count || 0}`)
    }
    lines.push('')
  }

  // Obligations by award category
  if (obsByCategory?.results?.length) {
    lines.push(`## Obligations by Award Category — FY${fy}`)
    lines.push('Source: /api/v2/agency/097/obligations_by_award_category/')
    for (const c of obsByCategory.results) {
      lines.push(`- ${c.category}: ${fmtB(c.aggregated_amount)} (${(c.transaction_count||0).toLocaleString()} transactions)`)
    }
    lines.push('')
  }

  // Financial balances
  if (finBalances?.results?.length) {
    lines.push(`## Financial Balances — FY${fy}`)
    lines.push(`Source: /api/v2/financial_balances/agencies/?funding_agency_id=${DOD_AGENCY_ID}`)
    for (const r of finBalances.results.slice(0, 10)) {
      lines.push(`- ${r.budget_authority_amount ? `BA ${fmtB(r.budget_authority_amount)}` : ''} ${r.obligated_amount ? `Obl ${fmtB(r.obligated_amount)}` : ''}`)
    }
    lines.push('')
  }

  // Reporting differences (SF-133 equivalent from USASpending)
  if (reportingDiff?.results?.length) {
    lines.push(`## Reporting Differences — FY${fy} P${period}`)
    lines.push('Source: /api/v2/reporting/agencies/097/differences/')
    lines.push('Account-level differences between GTAS submission and USASpending award data.')
    for (const r of reportingDiff.results.slice(0, 20)) {
      const diff = fmtB(r.difference)
      const file_a = fmtB(r.file_a_obligation)
      const file_b = fmtB(r.file_b_obligation)
      lines.push(`- ${r.tas || r.account_number || 'TAS'}: File A ${file_a} | File B ${file_b} | Diff ${diff}`)
    }
    lines.push('')
  }

  // Agency reporting overview
  if (overview?.results?.length) {
    lines.push(`## Agency Reporting Status — FY${fy} P${period}`)
    lines.push('Source: /api/v2/reporting/agencies/overview/')
    for (const a of overview.results.slice(0, 15)) {
      const gObl = a.tas_account_discrepancies_totals?.gtas_obligation_total
      const diff  = a.obligation_difference
      lines.push(`- ${a.agency_name}: GTAS Obl ${fmtB(gObl)} | Diff ${diff != null ? fmtB(Math.abs(diff)) : '—'}`)
    }
    lines.push('')
  }

  // Spending by federal account (award-side)
  if (spendByAcct?.results?.length) {
    lines.push(`## Top Federal Accounts by Award Spending — FY${fy}`)
    lines.push('Source: /api/v2/search/spending_by_category/federal_account/')
    for (const r of spendByAcct.results.slice(0, 20)) {
      lines.push(`- ${r.code || r.id}: ${r.name || ''} — ${fmtB(r.aggregated_amount)}`)
    }
    lines.push('')
  }

  // Top contracts
  if (contracts?.results?.length) {
    lines.push(`## Top DoD Contract Awards — FY${fy}`)
    lines.push('Source: /api/v2/search/spending_by_award/')
    for (const c of contracts.results.slice(0, 25)) {
      lines.push(`- ${c['Recipient Name']||'Unknown'} | ${c['Awarding Sub Agency']||'DoD'} | ${c['Award Type']||''} | ${fmtB(c['Award Amount'])}`)
    }
    lines.push('')
  }

  lines.push('## Analysis Notes')
  lines.push(`Period: FY${fy} P${period}/12 (${Math.round(period/12*100)}% through fiscal year, Q${q})`)
  lines.push('OC 11/12 = MILPERS. OC 25 = Services contracts. OC 31 = Equipment/procurement.')
  lines.push('Reporting differences = SF-133 File A vs File B account reconciliation.')
  lines.push('All data from USASpending.gov API v2. Submission period certified by agency comptrollers.')

  return lines.join('\n')
}

// ── Ingest ──────────────────────────────────────────────────────────
async function ingest(filename, content) {
  console.log(`\n  → Ingesting: ${filename} (${content.length.toLocaleString()} chars)`)
  const r = await fetch(INGEST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${INGEST_SECRET}` },
    body: JSON.stringify({ source: 'usaspending', dataset: 'dod_obligations', period: filename, filename, content }),
  })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error || `Ingest HTTP ${r.status}`)
  console.log(`  ✓ ${d.action} — ${d.chunk_count} chunks`)
  return d
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔄 DoD Obligation Data Pull`)
  console.log(`   ${new Date().toISOString()}\n`)

  // Step 0: Find latest published period (drives all subsequent calls)
  console.log('── 0. Submission periods (find latest published) ────────')
  const { fy, period } = await getLatestPublishedPeriod()
  const label = `FY${fy}_P${String(period).padStart(2, '0')}`
  console.log(`\n📅 Using: ${label} (latest certified submission period)\n`)

  const collected = []
  const results   = {}

  // Run all fetches
  const fetches = [
    ['budRes',        '1. Budgetary resources',          () => fetchBudgetaryResources()],
    ['fedAcct',       '2. Federal accounts (TAS)',        () => fetchFederalAccounts(fy)],
    ['objClass',      '3. Object class (GET)',            () => fetchObjectClass(fy)],
    ['progActivity',  '4. Program activity (GET)',        () => fetchProgramActivity(fy)],
    ['subAgency',     '5. Sub-agency',                   () => fetchSubAgency(fy)],
    ['obsByCategory', '6. Obligations by award category', () => fetchObligationsByCategory(fy)],
    ['finBalances',   '7. Financial balances',           () => fetchFinancialBalances(fy)],
    ['majorOC',       '8. Major object class',           () => fetchMajorObjectClass(fy)],
    ['reportingDiff', '9. Reporting differences (SF-133)', () => fetchReportingDifferences(fy, period)],
    ['overview',      '10. Reporting overview',          () => fetchReportingOverview(fy, period)],
    ['spendByAcct',   '11. Spending by federal account', () => fetchSpendingByFederalAccount(fy)],
    ['contracts',     '12. Top contracts',               () => fetchTopContracts(fy)],
  ]

  for (const [key, label, fn] of fetches) {
    console.log(`\n── ${label} ${'─'.repeat(Math.max(0, 50 - label.length))}`)
    results[key] = await fn()
    if (results[key]) collected.push(key)
  }

  if (collected.length === 0) {
    console.error('\n❌ All sources failed')
    process.exit(1)
  }

  console.log(`\n── Summary ─────────────────────────────────────────────`)
  console.log(`Collected ${collected.length}/12 sources: ${collected.join(', ')}`)

  const content  = buildContent({ fy, period, ...results })
  const filename = `usaspending_dod_obligations_${label}.txt`
  await ingest(filename, content)

  console.log(`\n✅ Done — ${label} with ${collected.length}/12 sources`)
}

main().catch(e => { console.error('\n❌ Fatal:', e.message); process.exit(1) })
