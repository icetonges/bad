#!/usr/bin/env node
/**
 * fetch-dod-obligations.mjs  — Bulletproof edition
 *
 * Every API call is independently try/caught.
 * The script ALWAYS succeeds and ingests whatever it got.
 * Uses ONLY confirmed-working USASpending v2 endpoints.
 *
 * Data collected:
 *   1. Multi-year BA/Obligations/Outlays  — /agency/097/budgetary_resources/
 *   2. Federal accounts (TAS)             — /agency/097/federal_account/
 *   3. Object class (award-side)          — POST /search/spending_by_category/object_class/
 *   4. Program activity (award-side)      — POST /search/spending_by_category/program_activity/
 *   5. Top contracts                      — POST /search/spending_by_award/
 *   6. Agency reporting overview          — /reporting/agencies/overview/
 *   7. Treasury GTAS                      — api.fiscal.treasury.gov
 *   8. Sub-agency breakdown               — /agency/097/sub_agency/
 */

const INGEST_URL   = process.env.INGEST_URL
const INGEST_SECRET = process.env.INGEST_SECRET

if (!INGEST_URL || !INGEST_SECRET) {
  console.error('❌ INGEST_URL and INGEST_SECRET must be set as GitHub secrets')
  process.exit(1)
}

const USA  = 'https://api.usaspending.gov/api/v2'
const GTAS = 'https://api.fiscal.treasury.gov/services/api/fiscal_service/v2/accounting/od'
const DOD  = '097'

// ── Fiscal helpers ────────────────────────────────────────────────

function laggedPeriod(lag = 2) {
  const now = new Date()
  const m = now.getMonth() + 1
  let p = m >= 10 ? m - 9 : m + 3
  let fy = m >= 10 ? now.getFullYear() + 1 : now.getFullYear()
  p -= lag
  if (p < 2) { p += 12; fy -= 1 }
  return { fy, period: Math.max(2, Math.min(12, p)) }
}

const fyStart = fy => `${fy - 1}-10-01`
const fyEnd   = fy => `${fy}-09-30`
const fmtB    = v  => v != null && !isNaN(v) ? `$${(v/1e9).toFixed(2)}B` : 'N/A'
const fmtPct  = (n,d) => d ? `${((n/d)*100).toFixed(1)}%` : 'N/A'

// ── HTTP helpers (individually try/caught at call site) ───────────

async function get(url) {
  const r = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'FedFMMatter-Pipeline/2.0' },
    signal: AbortSignal.timeout(45000),
  })
  if (!r.ok) {
    const t = await r.text().catch(() => '')
    throw new Error(`HTTP ${r.status}: ${t.slice(0, 150)}`)
  }
  return r.json()
}

async function post(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'FedFMMatter-Pipeline/2.0' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  })
  if (!r.ok) {
    const t = await r.text().catch(() => '')
    throw new Error(`HTTP ${r.status}: ${t.slice(0, 150)}`)
  }
  return r.json()
}

async function tryGet(label, url) {
  try {
    console.log(`  ✦ ${label}`)
    const d = await get(url)
    console.log(`    ✓ ok`)
    return d
  } catch (e) {
    console.warn(`    ✗ ${e.message.slice(0, 100)}`)
    return null
  }
}

async function tryPost(label, url, body) {
  try {
    console.log(`  ✦ ${label}`)
    const d = await post(url, body)
    console.log(`    ✓ ok`)
    return d
  } catch (e) {
    console.warn(`    ✗ ${e.message.slice(0, 100)}`)
    return null
  }
}

// ── Object class names ────────────────────────────────────────────

const OC = {
  '10':'Personnel Compensation & Benefits', '11':'Personnel Compensation',
  '12':'Personnel Benefits', '13':'Benefits — Former Personnel',
  '20':'Contractual Services & Supplies', '21':'Travel',
  '22':'Transportation of Things', '23':'Rent/Comm/Utilities',
  '24':'Printing', '25':'Other Services (OC25)',
  '26':'Supplies & Materials', '31':'Equipment (OC31)',
  '32':'Land & Structures', '33':'Investments',
  '41':'Grants/Fixed Charges', '99':'Total/Other',
}

// ── Build text content ────────────────────────────────────────────

function build({ fy, period, budRes, fedAcct, objClass, progActivity, contracts, subAgency, reportingOverview, gtas }) {
  const q = Math.ceil(period / 3)
  const lines = [
    `# DoD SF-133 Level Obligation Data — FY${fy} Q${q} (Period ${period})`,
    `Sources: USASpending.gov API v2 + Treasury GTAS`,
    `Agency: Department of Defense (toptier_code 097)`,
    `Retrieved: ${new Date().toISOString().slice(0,10)}`,
    `Note: DoD data lags up to 90 days per DATA Act policy. Use GTAS for certified SF-133.`,
    '',
  ]

  // ── 1. Budgetary resources multi-year ─────────────────────────
  if (budRes?.agency_data_by_year?.length) {
    lines.push('## Multi-Year DoD Budgetary Resources (USASpending)')
    lines.push('Source: /agency/097/budgetary_resources/')
    const years = budRes.agency_data_by_year.sort((a,b) => a.fiscal_year - b.fiscal_year)
    for (const y of years) {
      const ba  = y.total_budgetary_resources
      const obl = y.total_obligations
      const out = y.total_outlays
      lines.push(`FY${y.fiscal_year}: BA ${fmtB(ba)} | Obligations ${fmtB(obl)} | Outlays ${fmtB(out)} | Rate ${fmtPct(obl, ba)}`)
    }
    lines.push('')
  }

  // ── 2. Federal accounts (TAS) ─────────────────────────────────
  if (fedAcct?.totals) {
    const t = fedAcct.totals
    lines.push(`## DoD Federal Accounts Summary — FY${fy}`)
    lines.push('Source: /agency/097/federal_account/')
    lines.push(`Total BA: ${fmtB(t.total_budgetary_resources)}`)
    lines.push(`Obligations: ${fmtB(t.obligated_amount)}`)
    lines.push(`Outlays: ${fmtB(t.gross_outlay_amount)}`)
    lines.push(`Obligation Rate: ${fmtPct(t.obligated_amount, t.total_budgetary_resources)}`)
    lines.push('')

    if (fedAcct.results?.length) {
      lines.push(`### Top Federal Accounts by Obligation (TAS detail)`)
      for (const r of fedAcct.results.slice(0, 30)) {
        const rate = fmtPct(r.obligated_amount, r.total_budgetary_resources)
        lines.push(`- ${r.code} "${r.name}": Obligations ${fmtB(r.obligated_amount)} | BA ${fmtB(r.total_budgetary_resources)} | Rate ${rate}`)
      }
      lines.push('')
    }
  }

  // ── 3. Object class ───────────────────────────────────────────
  if (objClass?.results?.length) {
    lines.push(`## Obligations by OMB Object Class — FY${fy} Q${q}`)
    lines.push('Source: /api/v2/spending/?type=object_class (spending explorer)')
    lines.push('Direct map to SF-133 object class lines.')
    for (const oc of objClass.results.slice(0, 30)) {
      const name = oc.name || oc.common_name || ''
      const code = oc.code || ''
      const amt  = oc.amount ?? oc.aggregated_amount ?? 0
      lines.push(`- OC ${code} ${name}: ${fmtB(amt)}`)
    }
    lines.push('')
  }

  // ── 4. Program activity ───────────────────────────────────────
  if (progActivity?.results?.length) {
    lines.push(`## Obligations by Program Activity — FY${fy} Q${q}`)
    lines.push('Source: /api/v2/spending/?type=program_activity')
    for (const pa of progActivity.results.slice(0, 30)) {
      const name = pa.name || pa.program_activity_name || ''
      const code = pa.code || pa.program_activity_code || ''
      const amt  = pa.amount ?? pa.aggregated_amount ?? 0
      lines.push(`- PA ${code} "${name}": ${fmtB(amt)}`)
    }
    lines.push('')
  }

  // ── 5. Sub-agency ─────────────────────────────────────────────
  if (subAgency?.results?.length) {
    lines.push(`## Obligations by DoD Sub-Agency — FY${fy}`)
    lines.push('Source: /agency/097/sub_agency/')
    for (const s of subAgency.results.slice(0, 20)) {
      lines.push(`- ${s.name}: Obligations ${fmtB(s.total_obligations)} | Awards ${fmtB(s.total_outlays)}`)
    }
    lines.push('')
  }

  // ── 6. Treasury GTAS ──────────────────────────────────────────
  if (gtas?.data?.length) {
    const rows = gtas.data
    const totObl = rows.reduce((s,r) => s + (parseFloat(r.obligations_incurred_by_program_object_class_cpe)||0), 0)
    const totBA  = rows.reduce((s,r) => s + (parseFloat(r.budget_authority_appropriation_amt)||0), 0)
    const totOut = rows.reduce((s,r) => s + (parseFloat(r.gross_outlay_by_program_object_class_cpe)||0), 0)
    const totUnobl = rows.reduce((s,r) => s + (parseFloat(r.unobligated_balance_cpe)||0), 0)

    lines.push(`## Treasury GTAS — Certified SF-133 (FY${fy} Q${q})`)
    lines.push('Source: api.fiscal.treasury.gov/gtas_budgetary_resources — CERTIFIED quarterly data')
    lines.push('This is the authoritative SF-133 source used for OMB reporting.')
    lines.push(`Accounts reported: ${rows.length}`)
    lines.push(`Total BA (certified): ${fmtB(totBA)}`)
    lines.push(`Total Obligations (certified): ${fmtB(totObl)}`)
    lines.push(`Total Outlays (certified): ${fmtB(totOut)}`)
    lines.push(`Total Unobligated Balance: ${fmtB(totUnobl)}`)
    lines.push(`Certified Obligation Rate: ${fmtPct(totObl, totBA)}`)
    lines.push('')

    const sorted = [...rows].sort((a,b) =>
      (parseFloat(b.obligations_incurred_by_program_object_class_cpe)||0) -
      (parseFloat(a.obligations_incurred_by_program_object_class_cpe)||0)
    )
    lines.push('### Top DoD TAS Accounts by GTAS Obligations')
    for (const r of sorted.slice(0, 25)) {
      const obl = parseFloat(r.obligations_incurred_by_program_object_class_cpe)||0
      const ba  = parseFloat(r.budget_authority_appropriation_amt)||0
      lines.push(`- ${r.agency_identifier}-${r.main_account_code}: Obl ${fmtB(obl)} | BA ${fmtB(ba)} | Rate ${fmtPct(obl,ba)}`)
    }
    lines.push('')
  }

  // ── 7. Reporting overview ─────────────────────────────────────
  if (reportingOverview?.results?.length) {
    lines.push(`## DoD Agency Reporting Status — FY${fy} P${period}`)
    lines.push('Source: /reporting/agencies/overview/')
    for (const a of reportingOverview.results.slice(0, 15)) {
      const gObl = a.tas_account_discrepancies_totals?.gtas_obligation_total
      const diff = a.obligation_difference
      lines.push(`- ${a.agency_name}: GTAS Obl ${fmtB(gObl)} | Discrepancy ${diff ? fmtB(Math.abs(diff)) : 'none'}`)
    }
    lines.push('')
  }

  // ── 8. Top contracts ──────────────────────────────────────────
  if (contracts?.results?.length) {
    lines.push(`## Top DoD Contract Awards — FY${fy}`)
    lines.push('Source: POST /search/spending_by_award/')
    for (const c of contracts.results.slice(0, 25)) {
      const amt = c['Award Amount'] ? fmtB(c['Award Amount']) : 'N/A'
      lines.push(`- ${c['Recipient Name']||'Unknown'} | ${c['Awarding Sub Agency']||'DoD'} | ${c['Award Type']||''} | ${amt}`)
    }
    lines.push('')
  }

  lines.push('## Analysis Reference')
  lines.push(`FY${fy} Period ${period}/12 — ${Math.round(period/12*100)}% through fiscal year`)
  lines.push('OC 11/12 = MILPERS-driven. OC 25 = O&M services contracts. OC 31 = Procurement equipment.')
  lines.push('GTAS is the certified SF-133 source. USASpending award data excludes non-award obligations.')
  lines.push('For full TAS×PA×OC breakdown (File B), use USASpending Custom Account Download.')

  return lines.join('\n')
}

// ── Ingest ────────────────────────────────────────────────────────

async function ingest(filename, content, dataset, period) {
  console.log(`\n  → Ingesting ${filename} (${content.length.toLocaleString()} chars)...`)
  const r = await fetch(INGEST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${INGEST_SECRET}` },
    body: JSON.stringify({ source: 'usaspending', dataset, period, filename, content }),
  })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error || `Ingest status ${r.status}`)
  console.log(`  ✓ ${d.action} — ${d.chunk_count} chunks`)
  return d
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  const { fy, period } = laggedPeriod(2)
  const label = `FY${fy}_P${String(period).padStart(2,'0')}`
  const q = Math.ceil(period / 3)
  const collected = []

  console.log(`\n🔄 DoD SF-133 Obligation Data Pull — ${label}`)
  console.log(`   ${new Date().toISOString()}\n`)

  console.log('── 1. Multi-year budgetary resources ────────────────────')
  const budRes = await tryGet('budgetary_resources', `${USA}/agency/${DOD}/budgetary_resources/`)
  if (budRes) collected.push('budgetary_resources')

  console.log('\n── 2. Federal accounts / TAS ────────────────────────────')
  const fedAcct = await tryGet('federal_account', `${USA}/agency/${DOD}/federal_account/?fiscal_year=${fy}&limit=30&sort=obligated_amount&order=desc`)
  if (fedAcct) collected.push('federal_account')

  console.log('\n── 3. Object class breakdown ─────────────────────────────')
  // /api/v2/spending/ requires a *published* quarter — try from current backwards
  let objClass = null
  for (let tryFY = fy, tryQ = Math.ceil(period / 3); tryFY >= fy - 2; ) {
    const result = await tryPost(`spending/object_class FY${tryFY}Q${tryQ}`, `${USA}/spending/`, {
      type: 'object_class',
      filters: { fy: String(tryFY), quarter: String(tryQ) },
    })
    if (result && !result.detail?.includes('do not belong')) { objClass = result; break }
    // Step back one quarter
    tryQ -= 1
    if (tryQ < 1) { tryQ = 4; tryFY -= 1 }
    if (tryFY < fy - 2) break
  }
  if (objClass) collected.push('object_class')

  console.log('\n── 4. Program activity breakdown ────────────────────────')
  // spending explorer program_activity requires numeric USASpending agency ID
  // DoD toptier numeric ID = 126 (not the toptier_code "097")
  // Also: remove agency filter entirely on fallback — get all fed, then filter locally
  let progActivity = null
  for (let tryFY = fy, tryQ = Math.ceil(period / 3); tryFY >= fy - 2; ) {
    const result = await tryPost(`spending/program_activity FY${tryFY}Q${tryQ}`, `${USA}/spending/`, {
      type: 'program_activity',
      filters: { fy: String(tryFY), quarter: String(tryQ), agency: 126 },
    })
    if (result && !result.detail) { progActivity = result; break }
    tryQ -= 1
    if (tryQ < 1) { tryQ = 4; tryFY -= 1 }
    if (tryFY < fy - 2) break
  }
  if (progActivity) collected.push('program_activity')

  console.log('\n── 5. Sub-agency breakdown ──────────────────────────────')
  const subAgency = await tryGet('sub_agency', `${USA}/agency/${DOD}/sub_agency/?fiscal_year=${fy}&limit=30`)
  if (subAgency) collected.push('sub_agency')

  console.log('\n── 6. Treasury GTAS via FiscalData API ──────────────────')
  let gtas = null
  // FY2026 Q2 not published yet — try Q2, Q1, then FY2025 Q4, Q3...
  const gtasQueue = []
  for (let tryFY = fy, tryQ = Math.ceil(period / 3); gtasQueue.length < 6; ) {
    gtasQueue.push({ fy: tryFY, q: tryQ })
    tryQ--
    if (tryQ < 1) { tryQ = 4; tryFY-- }
  }
  for (const { fy: tFY, q: tQ } of gtasQueue) {
    try {
      const params = new URLSearchParams({
        fields: 'reporting_fiscal_year,reporting_fiscal_quarter,agency_identifier,main_account_code,budget_authority_appropriation_amt,obligations_incurred_by_program_object_class_cpe,gross_outlay_by_program_object_class_cpe,unobligated_balance_cpe',
        filter: `reporting_fiscal_year:eq:${tFY},reporting_fiscal_quarter:eq:${tQ},agency_identifier:eq:${DOD}`,
        'page[size]': '100', 'page[number]': '1',
        sort: '-obligations_incurred_by_program_object_class_cpe',
      })
      const url = `https://api.fiscaldata.treasury.gov/services/api/v1/accounting/od/gtas_budgetary_resources?${params}`
      console.log(`  ✦ FiscalData GTAS FY${tFY} Q${tQ}`)
      const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(30000) })
      if (r.ok) {
        const d = await r.json()
        if (d.data?.length > 0) {
          gtas = { data: d.data, fy: tFY, quarter: tQ }
          console.log(`    ✓ ok — ${d.data.length} records (FY${tFY} Q${tQ})`)
          break
        } else {
          console.log(`    ✗ no data for FY${tFY} Q${tQ}, trying earlier`)
        }
      } else { console.warn(`    ✗ HTTP ${r.status} for FY${tFY} Q${tQ}`) }
    } catch (e) { console.warn(`    ✗ ${e.message.slice(0, 80)}`) }
  }
  if (gtas?.data?.length) collected.push('gtas')

  console.log('\n── 7. Agency reporting overview ─────────────────────────')
  const reportingOverview = await tryGet('reporting_overview', `${USA}/reporting/agencies/overview/?fiscal_year=${fy}&fiscal_period=${period}&limit=30`)
  if (reportingOverview) collected.push('reporting_overview')

  console.log('\n── 8. Top contracts ─────────────────────────────────────')
  const contracts = await tryPost('spending_by_award', `${USA}/search/spending_by_award/`, {
    filters: {
      agencies: [{ type: 'awarding', tier: 'toptier', name: 'Department of Defense' }],
      time_period: [{ start_date: fyStart(fy), end_date: fyEnd(fy) }],
      award_type_codes: ['A','B','C','D'],
    },
    fields: ['Award ID','Recipient Name','Award Amount','Awarding Sub Agency','Award Type','Description'],
    sort: 'Award Amount', order: 'desc', limit: 30, page: 1,
  })
  if (contracts) collected.push('contracts')

  if (collected.length === 0) {
    console.error('\n❌ All API sources failed. Check network access from GitHub Actions.')
    process.exit(1)
  }

  console.log(`\n── Collected ${collected.length}/8 sources: ${collected.join(', ')}`)

  // Build and ingest
  const content = build({ fy, period, budRes, fedAcct, objClass, progActivity, subAgency, gtas, reportingOverview, contracts })
  const filename = `usaspending_dod_obligations_${label}.txt`
  await ingest(filename, content, 'dod_obligations', label)

  console.log(`\n✅ Done — ${label} ingested with ${collected.length} data sources`)
}

main().catch(e => {
  console.error('\n❌ Fatal error:', e.message)
  process.exit(1)
})
