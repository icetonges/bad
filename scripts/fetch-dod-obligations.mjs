#!/usr/bin/env node
/**
 * fetch-dod-obligations.mjs
 *
 * Pulls DoD obligation data from USASpending.gov API and ingests it
 * into the FedFMMatter knowledge base via /api/ingest.
 *
 * Called by GitHub Action on a weekly schedule.
 *
 * Environment variables:
 *   INGEST_URL      — e.g. https://fedfm.vercel.app/api/ingest
 *   INGEST_SECRET   — must match INGEST_SECRET in Vercel env
 *
 * USASpending API docs: https://api.usaspending.gov
 */

import { readFileSync } from 'fs'

const INGEST_URL = process.env.INGEST_URL
const INGEST_SECRET = process.env.INGEST_SECRET

if (!INGEST_URL || !INGEST_SECRET) {
  console.error('❌ INGEST_URL and INGEST_SECRET must be set')
  process.exit(1)
}

// ── Fiscal period helpers ──────────────────────────────────────────

function getCurrentFiscalYear() {
  const now = new Date()
  return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear()
}

function getCurrentFiscalPeriod() {
  const now = new Date()
  // Federal fiscal year starts Oct 1. Period = month within FY (1-12)
  const month = now.getMonth() + 1 // 1-12
  const fy = getCurrentFiscalYear()
  const fyMonth = month >= 10 ? month - 9 : month + 3
  return { fy, period: fyMonth }
}

// ── USASpending API calls ──────────────────────────────────────────

const USASPENDING_BASE = 'https://api.usaspending.gov/api/v2'
const DOD_AGENCY_ID = '097' // DoD Treasury account identifier

/**
 * Fetch DoD agency-level obligation totals by fiscal period
 */
async function fetchDoDObligationsByPeriod(fy, period) {
  const url = `${USASPENDING_BASE}/reporting/agencies/overview/?fiscal_year=${fy}&fiscal_period=${period}&limit=50`
  console.log(`  Fetching agency overview FY${fy} P${period}...`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`USASpending agency overview failed: ${res.status}`)
  return res.json()
}

/**
 * Fetch DoD spending by budget function
 */
async function fetchDoDByBudgetFunction(fy) {
  const url = `${USASPENDING_BASE}/spending/?type=budget_function&fiscal_year=${fy}`
  console.log(`  Fetching budget function breakdown FY${fy}...`)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'budget_function',
      filters: { agency: DOD_AGENCY_ID },
    }),
  })
  if (!res.ok) throw new Error(`USASpending budget function failed: ${res.status}`)
  return res.json()
}

/**
 * Fetch DoD federal accounts with obligation amounts
 */
async function fetchDoDFederalAccounts(fy, period) {
  const url = `${USASPENDING_BASE}/reporting/agencies/${DOD_AGENCY_ID}/overview/?fiscal_year=${fy}&fiscal_period=${period}`
  console.log(`  Fetching DoD federal accounts FY${fy} P${period}...`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`USASpending DoD accounts failed: ${res.status}`)
  return res.json()
}

/**
 * Fetch top DoD award obligations (contracts, grants, IDVs)
 */
async function fetchDoDTopAwards(fy) {
  const url = `${USASPENDING_BASE}/search/spending_by_award/`
  console.log(`  Fetching top DoD awards FY${fy}...`)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        agencies: [{ type: 'awarding', tier: 'toptier', name: 'Department of Defense' }],
        time_period: [{ start_date: `${fy - 1}-10-01`, end_date: `${fy}-09-30` }],
        award_type_codes: ['A', 'B', 'C', 'D'], // Contracts
      },
      fields: ['Award ID', 'Recipient Name', 'Award Amount', 'Total Outlays', 'Award Type', 'Awarding Agency', 'Awarding Sub Agency'],
      sort: 'Award Amount',
      order: 'desc',
      limit: 50,
      page: 1,
    }),
  })
  if (!res.ok) throw new Error(`USASpending awards failed: ${res.status}`)
  return res.json()
}

/**
 * Fetch DoD spending by program activity (budget execution detail)
 */
async function fetchDoDProgramActivity(fy, period) {
  const url = `${USASPENDING_BASE}/reporting/agencies/${DOD_AGENCY_ID}/discrepancies/?fiscal_year=${fy}&fiscal_period=${period}`
  console.log(`  Fetching program activity FY${fy} P${period}...`)
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ── Format data as text for embedding ─────────────────────────────

function formatObligationData({ fy, period, agencyData, budgetFunctionData, accountData, awardData }) {
  const lines = []
  const label = `FY${fy} Period ${period} (through ${getMonthLabel(period, fy)})`

  lines.push(`# DoD Obligation Analysis — ${label}`)
  lines.push(`Source: USASpending.gov API. Retrieved: ${new Date().toISOString().slice(0, 10)}`)
  lines.push(`Fiscal Year: ${fy} | Fiscal Period: ${period}`)
  lines.push('')

  // Agency overview
  if (agencyData?.results) {
    lines.push('## Agency Overview — Obligations by Reporting Entity')
    const dodAgencies = agencyData.results.filter(a =>
      a.agency_name?.toLowerCase().includes('defense') ||
      a.agency_name?.toLowerCase().includes('army') ||
      a.agency_name?.toLowerCase().includes('navy') ||
      a.agency_name?.toLowerCase().includes('air force') ||
      a.agency_name?.toLowerCase().includes('marine')
    )
    for (const agency of dodAgencies.slice(0, 20)) {
      lines.push(`- ${agency.agency_name}: Obligations $${fmtM(agency.total_budgetary_resources)}M | Outlays $${fmtM(agency.total_outlays)}M | Diff $${fmtM(agency.diff_approp_ocpa)}M`)
    }
    lines.push('')
  }

  // Budget function
  if (budgetFunctionData?.results) {
    lines.push('## Spending by Budget Function')
    for (const bf of budgetFunctionData.results.slice(0, 15)) {
      lines.push(`- ${bf.name} (${bf.id}): Obligations $${fmtB(bf.obligated_amount)}B`)
    }
    lines.push('')
  }

  // Federal accounts
  if (accountData) {
    lines.push('## DoD Federal Accounts Summary')
    if (accountData.total_budgetary_resources !== undefined) {
      lines.push(`Total Budgetary Resources: $${fmtB(accountData.total_budgetary_resources)}B`)
      lines.push(`Total Obligations: $${fmtB(accountData.total_obligations)}B`)
      lines.push(`Total Outlays: $${fmtB(accountData.total_outlays)}B`)
      if (accountData.obligation_rate !== undefined) {
        lines.push(`Obligation Rate: ${(accountData.obligation_rate * 100).toFixed(1)}%`)
      }
    }
    lines.push('')
  }

  // Top awards
  if (awardData?.results) {
    lines.push('## Top DoD Contract Awards')
    lines.push(`Total awards shown: ${awardData.results.length} (sorted by obligation amount)`)
    for (const award of awardData.results.slice(0, 30)) {
      const amt = award['Award Amount'] ? `$${fmtM(award['Award Amount'])}M` : 'N/A'
      const sub = award['Awarding Sub Agency'] || award['Awarding Agency'] || 'DoD'
      lines.push(`- ${award['Recipient Name'] ?? 'Unknown'} | ${sub} | ${award['Award Type'] ?? ''} | ${amt}`)
    }
    lines.push('')
  }

  lines.push('## Key Metrics for Agent Analysis')
  lines.push(`Fiscal Year: ${fy}`)
  lines.push(`Reporting Period: ${period} of 12 (${Math.round(period / 12 * 100)}% through fiscal year)`)
  lines.push('Data currency: Weekly automated pull from USASpending.gov')

  return lines.join('\n')
}

function fmtB(val) { return val ? (val / 1e9).toFixed(1) : '?' }
function fmtM(val) { return val ? (val / 1e6).toFixed(0) : '?' }

function getMonthLabel(period, fy) {
  // Period 1 = October, Period 12 = September
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
  const year = period <= 3 ? fy - 1 : fy
  return `${months[period - 1]} ${year}`
}

// ── Ingest to FedFMMatter ──────────────────────────────────────────

async function ingest({ filename, content, dataset, period, metadata }) {
  console.log(`  Ingesting ${filename} (${content.length} chars)...`)
  const res = await fetch(INGEST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${INGEST_SECRET}`,
    },
    body: JSON.stringify({ source: 'usaspending', dataset, period, filename, content, metadata }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Ingest failed: ${data.error}`)
  console.log(`  ✓ ${data.action} — ${data.chunk_count} chunks`)
  return data
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  const { fy, period } = getCurrentFiscalPeriod()
  console.log(`\n🔄 DoD Obligation Data Pull — FY${fy} Period ${period}`)
  console.log(`   ${new Date().toISOString()}\n`)

  const results = []

  try {
    // 1. Agency overview
    const agencyData = await fetchDoDObligationsByPeriod(fy, period)

    // 2. Budget function breakdown
    const budgetFunctionData = await fetchDoDByBudgetFunction(fy).catch(() => null)

    // 3. DoD federal accounts
    const accountData = await fetchDoDFederalAccounts(fy, period).catch(() => null)

    // 4. Top contract awards
    const awardData = await fetchDoDTopAwards(fy).catch(() => null)

    // Format combined content
    const content = formatObligationData({ fy, period, agencyData, budgetFunctionData, accountData, awardData })
    const periodLabel = `${fy}_P${String(period).padStart(2, '0')}`
    const filename = `usaspending_dod_obligations_${periodLabel}.txt`

    const result = await ingest({
      filename,
      content,
      dataset: 'dod_obligations',
      period: periodLabel,
      metadata: { fy, period, pull_date: new Date().toISOString() },
    })
    results.push(result)
  } catch (err) {
    console.error(`  ❌ Obligation pull failed: ${err.message}`)
    results.push({ error: err.message })
  }

  // Summary
  console.log('\n── Summary ──────────────────────────────────────')
  const ok = results.filter(r => !r.error)
  const failed = results.filter(r => r.error)
  console.log(`✓ ${ok.length} dataset(s) ingested successfully`)
  if (failed.length) {
    console.log(`✗ ${failed.length} failed`)
    failed.forEach(f => console.log(`  - ${f.error}`))
  }
  console.log('')

  if (failed.length === results.length) {
    process.exit(1) // Fail the Action if everything failed
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
