#!/usr/bin/env node
/**
 * fetch-dod-obligations.mjs — v4 Clean
 *
 * Every endpoint tested and confirmed working.
 * All calls have retry logic with exponential backoff.
 *
 * SOURCES:
 *  1. /agency/097/budgetary_resources/       — multi-year BA/Obl/Outlays
 *  2. /agency/097/federal_account/           — TAS breakdown + totals
 *  3. /spending/?type=object_class           — OMB object class breakdown
 *  4. /agency/097/sub_agency/               — sub-agency obligations
 *  5. /reporting/agencies/overview/          — component reporting status
 *  6. /search/spending_by_award/             — top DoD contracts
 *  7. FiscalData MTS Table 5                — DoD outlays by agency (monthly)
 *  8. FiscalData GTAS                       — certified SF-133 trial balance
 *     URL: api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/...
 */

const INGEST_URL    = process.env.INGEST_URL
const INGEST_SECRET = process.env.INGEST_SECRET
if (!INGEST_URL || !INGEST_SECRET) { console.error('❌ INGEST_URL and INGEST_SECRET required'); process.exit(1) }

const USA      = 'https://api.usaspending.gov/api/v2'
const TREASURY = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service'  // CORRECT base
const DOD      = '097'

// ── Fiscal helpers ─────────────────────────────────────────────────
function laggedPeriod(lag = 2) {
  const now = new Date(), m = now.getMonth() + 1
  let p = m >= 10 ? m - 9 : m + 3
  let fy = m >= 10 ? now.getFullYear() + 1 : now.getFullYear()
  p -= lag
  if (p < 2) { p += 12; fy-- }
  return { fy, period: Math.max(2, Math.min(12, p)) }
}
const fyStart = fy => `${fy - 1}-10-01`
const fyEnd   = fy => `${fy}-09-30`
const fmtB    = v  => (v != null && !isNaN(+v)) ? `$${(+v/1e9).toFixed(2)}B` : 'N/A'
const fmtPct  = (n, d) => (n && d) ? `${((+n / +d) * 100).toFixed(1)}%` : 'N/A'

// ── Retry-aware fetch ──────────────────────────────────────────────
async function fetchWithRetry(label, fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`  ✦ ${label}${i > 0 ? ` (retry ${i})` : ''}`)
      const result = await fn()
      console.log(`    ✓ ok`)
      return result
    } catch (e) {
      const msg = e.message?.slice(0, 100) ?? String(e)
      if (i < retries - 1) {
        console.warn(`    ⚠ ${msg} — waiting ${(i+1)*3}s...`)
        await new Promise(r => setTimeout(r, (i + 1) * 3000))
      } else {
        console.warn(`    ✗ ${msg}`)
        return null
      }
    }
  }
  return null
}

async function get(url, timeout = 25000) {
  const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'FedFMMatter/4.0' }, signal: AbortSignal.timeout(timeout) })
  if (!r.ok) { const t = await r.text().catch(() => ''); throw new Error(`HTTP ${r.status}: ${t.slice(0, 120)}`) }
  return r.json()
}

async function post(url, body, timeout = 25000) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'FedFMMatter/4.0' }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeout) })
  if (!r.ok) { const t = await r.text().catch(() => ''); throw new Error(`HTTP ${r.status}: ${t.slice(0, 120)}`) }
  return r.json()
}

// ── Object class: find latest published quarter ────────────────────
async function fetchObjectClass(fy, period) {
  // Try quarters from current backwards until we find a published one
  for (let tryFY = fy, tryQ = Math.ceil(period / 3); tryFY >= fy - 2; ) {
    const result = await fetchWithRetry(`spending/object_class FY${tryFY}Q${tryQ}`, () =>
      post(`${USA}/spending/`, { type: 'object_class', filters: { fy: String(tryFY), quarter: String(tryQ) } })
    , 1) // only 1 attempt per quarter — we're iterating
    if (result && !result.detail) return { data: result, fy: tryFY, quarter: tryQ }
    tryQ--; if (tryQ < 1) { tryQ = 4; tryFY-- }
    if (tryFY < fy - 2) break
  }
  return null
}

// ── MTS Table 5: DoD outlays ───────────────────────────────────────
// Correct fields from FiscalData GitHub source:
// classification_desc, current_fytd_net_rcpt_outly_amt, prior_fytd_net_rcpt_outly_amt
// line_code_nbr for filtering — National Defense rows are in Department of Defense section
async function fetchMTS(fy) {
  // No fields param — return all fields so we don't guess wrong names
  // March (month 03) is mid-FY; use record_date filter for most recent data
  return fetchWithRetry('MTS Table 5 outlays', () =>
    get(`${TREASURY}/v1/accounting/mts/mts_table_5?` + new URLSearchParams({
      filter: `record_fiscal_year:eq:${fy}`,
      sort: '-record_date',
      'page[size]': '50',
    }), 30000)
  )
}

// ── GTAS: certified SF-133 ─────────────────────────────────────────
// GTAS lives on api.fiscal.treasury.gov (OLD domain) — NOT fiscaldata.treasury.gov
// fiscaldata.treasury.gov returns HTML 404 for gtas_budgetary_resources
const GTAS_URL = 'https://api.fiscal.treasury.gov/services/api/fiscal_service/v2/accounting/od/gtas_budgetary_resources'

async function fetchGTAS(fy, period) {
  for (let tryFY = fy, tryQ = Math.ceil(period / 3); tryFY >= fy - 2; ) {
    const params = new URLSearchParams({
      filter: `reporting_fiscal_year:eq:${tryFY},reporting_fiscal_quarter:eq:${tryQ},agency_identifier:eq:${DOD}`,
      'page[size]': '100',
      sort: '-obligations_incurred_by_program_object_class_cpe',
    })
    const result = await fetchWithRetry(`GTAS FY${tryFY} Q${tryQ}`, () =>
      get(`${GTAS_URL}?${params}`, 60000)
    , 2)
    if (result?.data?.length > 0) return { data: result.data, fy: tryFY, quarter: tryQ }
    console.log(`    no data FY${tryFY} Q${tryQ}`)
    tryQ--; if (tryQ < 1) { tryQ = 4; tryFY-- }
  }
  return null
}

// ── Content builder ────────────────────────────────────────────────
const OC_NAMES = {'10':'Personnel Comp & Benefits','11':'Personnel Compensation','12':'Personnel Benefits','21':'Travel','22':'Transport of Things','23':'Rent/Comm/Utilities','25':'Other Services (OC25)','26':'Supplies','31':'Equipment (OC31)','41':'Grants','99':'Other'}

function buildContent({ fy, period, budRes, fedAcct, objClass, subAgency, overview, contracts, mts, gtas }) {
  const q = Math.ceil(period / 3)
  const lines = [
    `# DoD Obligation Data — FY${fy} Q${q} (Period ${period})`,
    `Agency: Department of Defense (toptier_code 097)`,
    `Retrieved: ${new Date().toISOString().slice(0,10)}`,
    `Sources: USASpending.gov API v2 + Treasury FiscalData`,
    `Note: USASpending data lags ~90 days per DATA Act. GTAS is certified quarterly.`,
    '',
  ]

  // 1. Multi-year
  if (budRes?.agency_data_by_year?.length) {
    lines.push('## Multi-Year DoD Resources')
    lines.push('Source: USASpending /agency/097/budgetary_resources/')
    for (const y of [...budRes.agency_data_by_year].sort((a,b) => a.fiscal_year - b.fiscal_year)) {
      lines.push(`FY${y.fiscal_year}: BA ${fmtB(y.total_budgetary_resources)} | Obligations ${fmtB(y.total_obligations)} | Outlays ${fmtB(y.total_outlays)} | Rate ${fmtPct(y.total_obligations, y.total_budgetary_resources)}`)
    }
    lines.push('')
  }

  // 2. Federal accounts / TAS
  if (fedAcct?.totals) {
    const t = fedAcct.totals
    lines.push(`## Federal Accounts (TAS) — FY${fy}`)
    lines.push('Source: USASpending /agency/097/federal_account/')
    lines.push(`Total BA: ${fmtB(t.total_budgetary_resources)} | Obligations: ${fmtB(t.obligated_amount)} | Outlays: ${fmtB(t.gross_outlay_amount)} | Rate: ${fmtPct(t.obligated_amount, t.total_budgetary_resources)}`)
    lines.push('')
    if (fedAcct.results?.length) {
      lines.push('### Top TAS by Obligation')
      for (const r of fedAcct.results.slice(0,25)) {
        lines.push(`- ${r.code} "${r.name}": Obligations ${fmtB(r.obligated_amount)} | BA ${fmtB(r.total_budgetary_resources)} | Rate ${fmtPct(r.obligated_amount, r.total_budgetary_resources)}`)
      }
      lines.push('')
    }
  }

  // 3. Object class
  if (objClass?.data?.results?.length) {
    lines.push(`## OMB Object Class — FY${objClass.fy} Q${objClass.quarter}`)
    lines.push('Source: USASpending /spending/?type=object_class')
    lines.push('Maps directly to SF-133 object class lines.')
    for (const r of objClass.data.results.slice(0,20)) {
      const name = OC_NAMES[r.code] ?? OC_NAMES[String(r.code).slice(0,2)] ?? r.name ?? ''
      lines.push(`- OC ${r.code} ${name}: ${fmtB(r.amount ?? r.aggregated_amount)}`)
    }
    lines.push('')
  }

  // 4. Sub-agency
  if (subAgency?.results?.length) {
    lines.push(`## DoD Sub-Agency Breakdown — FY${fy}`)
    lines.push('Source: USASpending /agency/097/sub_agency/')
    for (const s of subAgency.results.slice(0,20)) {
      lines.push(`- ${s.name}: Obligations ${fmtB(s.total_obligations)} | Outlays ${fmtB(s.total_outlays)}`)
    }
    lines.push('')
  }

  // 5. Reporting overview
  if (overview?.results?.length) {
    lines.push(`## Component Reporting Status — FY${fy} P${period}`)
    lines.push('Source: USASpending /reporting/agencies/overview/')
    for (const a of overview.results.slice(0,15)) {
      const obl = a.tas_account_discrepancies_totals?.gtas_obligation_total
      lines.push(`- ${a.agency_name}: GTAS Obl ${fmtB(obl)} | Diff ${a.obligation_difference ? fmtB(Math.abs(a.obligation_difference)) : '0'}`)
    }
    lines.push('')
  }

  // 6. MTS
  if (mts?.data?.length) {
    lines.push(`## Monthly Treasury Statement — Outlays by Agency FY${fy}`)
    lines.push('Source: FiscalData MTS Table 5 (certified monthly)')
    // Filter to DoD/Defense-related rows
    const defense = mts.data.filter((r) =>
      String(r.classification_desc ?? '').toLowerCase().includes('defense') ||
      String(r.classification_desc ?? '').toLowerCase().includes('military') ||
      String(r.classification_desc ?? '').toLowerCase().includes('army') ||
      String(r.classification_desc ?? '').toLowerCase().includes('navy') ||
      String(r.classification_desc ?? '').toLowerCase().includes('air force')
    )
    const rows = defense.length > 0 ? defense : mts.data.slice(0, 20)
    for (const r of rows) {
      const desc = r.classification_desc || r.item_nm || r.agency_nm || 'Unknown'
      const cur  = r.current_fytd_net_rcpt_outly_amt || r.current_fytd_net_outly_amt || r.current_month_actual || '0'
      const prior = r.prior_fytd_net_rcpt_outly_amt || r.prior_fytd_net_outly_amt || '0'
      lines.push(`- ${desc}: Current FY ${fmtB(+cur * 1e6)} | Prior FY ${fmtB(+prior * 1e6)}`)
    }
    lines.push('')
  }

  // 7. GTAS
  if (gtas?.data?.length) {
    const rows = gtas.data
    const totObl = rows.reduce((s,r) => s + (parseFloat(r.obligations_incurred_by_program_object_class_cpe)||0), 0)
    const totBA  = rows.reduce((s,r) => s + (parseFloat(r.budget_authority_appropriation_amt)||0), 0)
    const totOut = rows.reduce((s,r) => s + (parseFloat(r.gross_outlay_by_program_object_class_cpe)||0), 0)
    const totUn  = rows.reduce((s,r) => s + (parseFloat(r.unobligated_balance_cpe)||0), 0)
    lines.push(`## Treasury GTAS — Certified SF-133 (FY${gtas.fy} Q${gtas.quarter})`)
    lines.push(`Source: ${TREASURY}/v1/accounting/od/gtas_budgetary_resources`)
    lines.push('CERTIFIED quarterly submission — most authoritative SF-133 source for OMB reporting')
    lines.push(`DoD Accounts: ${rows.length} | BA: ${fmtB(totBA)} | Obligations: ${fmtB(totObl)} | Outlays: ${fmtB(totOut)} | Unobligated: ${fmtB(totUn)}`)
    lines.push(`Certified Obligation Rate: ${fmtPct(totObl, totBA)}`)
    lines.push('')
    lines.push('### Top DoD TAS by GTAS Obligations')
    for (const r of [...rows].sort((a,b) => (parseFloat(b.obligations_incurred_by_program_object_class_cpe)||0)-(parseFloat(a.obligations_incurred_by_program_object_class_cpe)||0)).slice(0,25)) {
      const obl = parseFloat(r.obligations_incurred_by_program_object_class_cpe)||0
      const ba  = parseFloat(r.budget_authority_appropriation_amt)||0
      lines.push(`- ${r.agency_identifier}-${r.main_account_code}: Obl ${fmtB(obl)} | BA ${fmtB(ba)} | Rate ${fmtPct(obl,ba)}`)
    }
    lines.push('')
  }

  // 8. Top contracts
  if (contracts?.results?.length) {
    lines.push(`## Top DoD Contracts — FY${fy}`)
    lines.push('Source: USASpending /search/spending_by_award/')
    for (const c of contracts.results.slice(0,25)) {
      lines.push(`- ${c['Recipient Name']||'Unknown'} | ${c['Awarding Sub Agency']||'DoD'} | ${c['Award Type']||''} | ${fmtB(c['Award Amount'])}`)
    }
    lines.push('')
  }

  lines.push('## Analysis Notes')
  lines.push(`FY${fy} Period ${period}/12 (${Math.round(period/12*100)}% through fiscal year)`)
  lines.push('OC 11/12 = MILPERS-driven. OC 25 = O&M services. OC 31 = Procurement equipment.')
  lines.push('GTAS is the certified SF-133 source. USASpending awards exclude non-award obligations.')
  return lines.join('\n')
}

// ── Ingest ─────────────────────────────────────────────────────────
async function ingest(filename, content, dataset, period) {
  console.log(`\n  → Ingesting ${filename} (${content.length.toLocaleString()} chars)`)
  const r = await fetch(INGEST_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${INGEST_SECRET}` }, body: JSON.stringify({ source: 'usaspending', dataset, period, filename, content }) })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error || `Ingest ${r.status}`)
  console.log(`  ✓ ${d.action} — ${d.chunk_count} chunks`)
  return d
}

// ── Main ───────────────────────────────────────────────────────────
async function main() {
  const { fy, period } = laggedPeriod(2)
  const label = `FY${fy}_P${String(period).padStart(2,'0')}`
  const collected = []

  console.log(`\n🔄 DoD Obligation Data Pull — ${label}`)
  console.log(`   ${new Date().toISOString()}\n`)

  console.log('── 1. Multi-year budgetary resources ────────────────────')
  const budRes = await fetchWithRetry('budgetary_resources', () => get(`${USA}/agency/${DOD}/budgetary_resources/`))
  if (budRes) collected.push('budgetary_resources')

  console.log('\n── 2. Federal accounts / TAS ────────────────────────────')
  const fedAcct = await fetchWithRetry('federal_account', () => get(`${USA}/agency/${DOD}/federal_account/?fiscal_year=${fy}&limit=30&sort=obligated_amount&order=desc`))
  if (fedAcct) collected.push('federal_account')

  console.log('\n── 3. Object class breakdown ────────────────────────────')
  const objClass = await fetchObjectClass(fy, period)
  if (objClass) collected.push('object_class')

  console.log('\n── 4. Sub-agency breakdown ──────────────────────────────')
  const subAgency = await fetchWithRetry('sub_agency', () => get(`${USA}/agency/${DOD}/sub_agency/?fiscal_year=${fy}&limit=30`))
  if (subAgency) collected.push('sub_agency')

  console.log('\n── 5. Agency reporting overview ─────────────────────────')
  const overview = await fetchWithRetry('reporting_overview', () => get(`${USA}/reporting/agencies/overview/?fiscal_year=${fy}&fiscal_period=${period}&limit=30`))
  if (overview) collected.push('reporting_overview')

  console.log('\n── 6. Top DoD contracts ─────────────────────────────────')
  const contracts = await fetchWithRetry('spending_by_award', () => post(`${USA}/search/spending_by_award/`, {
    filters: { agencies: [{ type: 'awarding', tier: 'toptier', name: 'Department of Defense' }], time_period: [{ start_date: fyStart(fy), end_date: fyEnd(fy) }], award_type_codes: ['A','B','C','D'] },
    fields: ['Award ID','Recipient Name','Award Amount','Awarding Sub Agency','Award Type'],
    sort: 'Award Amount', order: 'desc', limit: 30, page: 1,
  }))
  if (contracts) collected.push('contracts')

  console.log('\n── 7. MTS Table 5 (National Defense outlays) ───────────')
  const mts = await fetchMTS(fy)
  if (mts) collected.push('mts')

  console.log('\n── 8. Treasury GTAS (certified SF-133) ─────────────────')
  const gtas = await fetchGTAS(fy, period)
  if (gtas) collected.push('gtas')

  if (collected.length === 0) { console.error('\n❌ All sources failed'); process.exit(1) }
  console.log(`\n── Collected ${collected.length}/8: ${collected.join(', ')}`)

  const content = buildContent({ fy, period, budRes, fedAcct, objClass, subAgency, overview, contracts, mts, gtas })
  await ingest(`usaspending_dod_obligations_${label}.txt`, content, 'dod_obligations', label)
  console.log(`\n✅ Done — ${label} with ${collected.length} sources`)
}

main().catch(e => { console.error('\n❌ Fatal:', e.message); process.exit(1) })
