#!/usr/bin/env node
/**
 * fetch-dod-obligations.mjs
 *
 * Pulls DoD obligation data from USASpending.gov and ingests into FedFMMatter.
 *
 * Fixes:
 *  - fiscal_period valid range is 2-12 (period 1/October is never valid)
 *  - USASpending data lags ~6-8 weeks — we always subtract 2 periods
 *  - Uses reliable endpoints: /agency/097/ series + /search/spending_by_award/
 *  - Fallback to prior period if current not yet published
 *
 * Env: INGEST_URL, INGEST_SECRET
 */

const INGEST_URL = process.env.INGEST_URL
const INGEST_SECRET = process.env.INGEST_SECRET

if (!INGEST_URL || !INGEST_SECRET) {
  console.error('❌ INGEST_URL and INGEST_SECRET env vars required')
  process.exit(1)
}

const BASE = 'https://api.usaspending.gov/api/v2'
const DOD_CODE = '097' // DoD toptier agency code

// ── Fiscal period helpers ──────────────────────────────────────────

function getFiscalPeriodWithLag(lagPeriods = 2) {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  const calYear = now.getFullYear()

  // Convert calendar month to FY period
  // Oct=P1, Nov=P2, Dec=P3, Jan=P4, Feb=P5, Mar=P6, Apr=P7, May=P8, Jun=P9, Jul=P10, Aug=P11, Sep=P12
  let fyPeriod = month >= 10 ? month - 9 : month + 3
  let fy = month >= 10 ? calYear + 1 : calYear

  // Apply lag — subtract periods, wrapping back into prior FY if needed
  fyPeriod -= lagPeriods
  if (fyPeriod < 2) {
    // Period 1 is invalid (Oct data isn't published until Dec at earliest)
    // Wrap to prior FY
    fyPeriod += 12
    fy -= 1
    if (fyPeriod < 2) fyPeriod = 2
  }

  // Clamp to valid range 2-12
  fyPeriod = Math.max(2, Math.min(12, fyPeriod))

  return { fy, period: fyPeriod }
}

function periodLabel(fy, period) {
  const months = ['', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
  const year = period <= 3 ? fy - 1 : fy
  return `${months[period]} ${year} (FY${fy} P${String(period).padStart(2,'0')})`
}

// ── API helpers ────────────────────────────────────────────────────

async function apiGet(path) {
  const url = `${BASE}${path}`
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GET ${path} → ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json()
}

async function apiPost(path, body) {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const b = await res.text().catch(() => '')
    throw new Error(`POST ${path} → ${res.status}: ${b.slice(0, 200)}`)
  }
  return res.json()
}

// ── Data fetchers ──────────────────────────────────────────────────

/** DoD budgetary resources by FY — total BA, obligations, outlays */
async function fetchDoDResources(fy) {
  console.log(`  [1/4] DoD budgetary resources FY${fy}...`)
  return apiGet(`/agency/${DOD_CODE}/budgetary_resources/?fiscal_year=${fy}`)
}

/** DoD obligations broken down by award category */
async function fetchDoDByCategory(fy) {
  console.log(`  [2/4] DoD obligations by award category FY${fy}...`)
  return apiGet(`/agency/${DOD_CODE}/obligations_by_award_category/?fiscal_year=${fy}`)
}

/** Agency reporting overview — data submission status and obligation differences */
async function fetchAgencyOverview(fy, period) {
  console.log(`  [3/4] Agency reporting overview FY${fy} P${period}...`)
  // Try requested period, fall back to period-1 if 404/400
  try {
    return await apiGet(`/reporting/agencies/overview/?fiscal_year=${fy}&fiscal_period=${period}&filter=defense&limit=25`)
  } catch (e) {
    if (period > 2) {
      console.log(`        → P${period} not available, trying P${period - 1}...`)
      return await apiGet(`/reporting/agencies/overview/?fiscal_year=${fy}&fiscal_period=${period - 1}&filter=defense&limit=25`)
    }
    throw e
  }
}

/** Top DoD contract awards for the fiscal year */
async function fetchTopContracts(fy) {
  console.log(`  [4/4] Top DoD contracts FY${fy}...`)
  const start = `${fy - 1}-10-01`
  const end   = `${fy}-09-30`
  return apiPost('/search/spending_by_award/', {
    filters: {
      agencies: [{ type: 'awarding', tier: 'toptier', name: 'Department of Defense' }],
      time_period: [{ start_date: start, end_date: end }],
      award_type_codes: ['A', 'B', 'C', 'D'],
    },
    fields: ['Award ID', 'Recipient Name', 'Award Amount', 'Awarding Sub Agency', 'Award Type', 'Description'],
    sort: 'Award Amount',
    order: 'desc',
    limit: 40,
    page: 1,
  })
}

// ── Format as text for chunking/embedding ─────────────────────────

function fmt(v, unit = 'B') {
  if (v == null) return 'N/A'
  const n = Number(v)
  if (unit === 'B') return `$${(n / 1e9).toFixed(1)}B`
  if (unit === 'M') return `$${(n / 1e6).toFixed(0)}M`
  if (unit === '%') return `${(n * 100).toFixed(1)}%`
  return String(n)
}

function buildContent({ fy, period, resources, byCategory, overview, contracts }) {
  const label = periodLabel(fy, period)
  const lines = []

  lines.push(`# DoD Obligation Data — ${label}`)
  lines.push(`Source: USASpending.gov (api.usaspending.gov/api/v2)`)
  lines.push(`Pulled: ${new Date().toISOString().slice(0,10)} | Fiscal Year: ${fy} | Period: ${period}/12`)
  lines.push(`Coverage: ${Math.round(period/12*100)}% through fiscal year`)
  lines.push('')

  // Budgetary resources
  if (resources) {
    const r = resources.agency_data_by_year?.find(d => d.fiscal_year === fy) || resources
    lines.push('## DoD Budgetary Resources')
    if (r.total_budgetary_resources != null) lines.push(`Total Budgetary Resources: ${fmt(r.total_budgetary_resources)}`)
    if (r.total_obligations != null)          lines.push(`Total Obligations Incurred: ${fmt(r.total_obligations)}`)
    if (r.total_outlays != null)              lines.push(`Total Outlays: ${fmt(r.total_outlays)}`)
    if (r.total_budgetary_resources && r.total_obligations) {
      const rate = r.total_obligations / r.total_budgetary_resources
      lines.push(`Obligation Rate: ${fmt(rate, '%')}`)
    }
    lines.push('')
  }

  // By category
  if (byCategory?.results) {
    lines.push('## DoD Obligations by Award Category')
    for (const c of byCategory.results) {
      lines.push(`- ${c.category}: ${fmt(c.aggregated_amount)} (${c.transaction_count?.toLocaleString() ?? '?'} transactions)`)
    }
    lines.push('')
  }

  // Agency reporting overview — DoD-related agencies
  if (overview?.results?.length) {
    lines.push('## DoD Component Reporting Status')
    for (const a of overview.results.slice(0, 20)) {
      const gtas = fmt(a.tas_account_discrepancies_totals?.gtas_obligation_total, 'M')
      const diff = a.obligation_difference != null ? fmt(a.obligation_difference, 'M') : 'N/A'
      lines.push(`- ${a.agency_name} (${a.abbreviation ?? a.toptier_code}): GTAS obligations ${gtas} | Diff ${diff}`)
    }
    lines.push('')
  }

  // Top contracts
  if (contracts?.results?.length) {
    lines.push(`## Top DoD Contract Awards — FY${fy} (sorted by obligation amount)`)
    lines.push(`Showing ${contracts.results.length} largest contracts out of ${contracts.page_metadata?.total?.toLocaleString() ?? '?'} total`)
    for (const c of contracts.results) {
      const amt  = c['Award Amount'] ? fmt(c['Award Amount'], 'M') : 'N/A'
      const sub  = c['Awarding Sub Agency'] || 'DoD'
      const name = c['Recipient Name'] || 'Unknown'
      const type = c['Award Type'] || ''
      lines.push(`- ${name} | ${sub} | ${type} | ${amt}`)
    }
    lines.push('')
  }

  lines.push('## Context for Analysis')
  lines.push(`This data covers DoD obligation activity for ${label}.`)
  lines.push('Use this data to: analyze obligation rates vs budget authority, identify top contractors, assess execution pace by component.')
  lines.push('For SF-133 reconciliation or TAFS-level detail, upload agency execution reports to the document library.')

  return lines.join('\n')
}

// ── Ingest ─────────────────────────────────────────────────────────

async function ingest(filename, content, dataset, period) {
  console.log(`\n  Ingesting "${filename}" (${content.length.toLocaleString()} chars)...`)
  const res = await fetch(INGEST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${INGEST_SECRET}` },
    body: JSON.stringify({ source: 'usaspending', dataset, period, filename, content }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Ingest returned ${res.status}`)
  console.log(`  ✓ ${data.action} — ${data.chunk_count} chunks embedded`)
  return data
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  const { fy, period } = getFiscalPeriodWithLag(2)
  const label = `FY${fy}_P${String(period).padStart(2,'0')}`

  console.log(`\n🔄 DoD Obligation Data Pull`)
  console.log(`   Period: ${periodLabel(fy, period)}`)
  console.log(`   ${new Date().toISOString()}\n`)

  // Fetch all datasets (non-fatal failures on individual endpoints)
  const [resources, byCategory, overview, contracts] = await Promise.allSettled([
    fetchDoDResources(fy),
    fetchDoDByCategory(fy),
    fetchAgencyOverview(fy, period),
    fetchTopContracts(fy),
  ]).then(results => results.map((r, i) => {
    if (r.status === 'rejected') {
      console.warn(`  ⚠ Dataset ${i+1} failed (non-fatal): ${r.reason?.message}`)
      return null
    }
    return r.value
  }))

  const successCount = [resources, byCategory, overview, contracts].filter(Boolean).length
  if (successCount === 0) {
    console.error('❌ All API calls failed. USASpending.gov may be down.')
    process.exit(1)
  }

  const content = buildContent({ fy, period, resources, byCategory, overview, contracts })
  const filename = `usaspending_dod_obligations_${label}.txt`

  await ingest(filename, content, 'dod_obligations', label)

  console.log(`\n✓ Done — ${label} ingested (${successCount}/4 datasets)`)
}

main().catch(err => {
  console.error('\n❌ Fatal:', err.message)
  process.exit(1)
})
