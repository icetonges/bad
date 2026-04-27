#!/usr/bin/env node
/**
 * fetch-dod-obligations.mjs
 *
 * Pulls the most granular publicly available DoD obligation data:
 *
 * SOURCE 1: USASpending /agency/097/object_class/
 *   → Obligations by OMB Object Class (11=Personnel, 12=Benefits, 21=Travel,
 *     25=Services, 26=Supplies, 31=Equipment, etc.) — SF-133 line equivalents
 *
 * SOURCE 2: USASpending /agency/097/program_activity/
 *   → Obligations by Program Activity code + name within each TAS
 *
 * SOURCE 3: USASpending /download/accounts/ (async File B)
 *   → TAS × Program Activity × Object Class × Fiscal Period
 *   → This IS the SF-133 at the sub-account level
 *   → Kicks off async download, polls until ready, downloads CSV
 *
 * SOURCE 4: Treasury GTAS (Governmentwide Treasury Account Symbol Adjusted Trial Balance)
 *   → Certified SF-133 data: BA, Obligations, Outlays, Unobligated Balance by TAS
 *   → Most authoritative source — used for OMB reporting
 *
 * SOURCE 5: USASpending /spending_by_category/object_class (award-side)
 *   → Award obligation by object class (contracts vs grants etc.)
 *
 * Env: INGEST_URL, INGEST_SECRET
 */

const INGEST_URL = process.env.INGEST_URL
const INGEST_SECRET = process.env.INGEST_SECRET
if (!INGEST_URL || !INGEST_SECRET) { console.error('❌ INGEST_URL and INGEST_SECRET required'); process.exit(1) }

const USA = 'https://api.usaspending.gov/api/v2'
const GTAS = 'https://api.fiscal.treasury.gov/services/api/fiscal_service/v2/accounting/od'
const DOD = '097'

// ── Fiscal period helpers ──────────────────────────────────────────

function laggedPeriod(lag = 2) {
  const now = new Date()
  const m = now.getMonth() + 1
  let p = m >= 10 ? m - 9 : m + 3
  let fy = m >= 10 ? now.getFullYear() + 1 : now.getFullYear()
  p -= lag
  if (p < 2) { p += 12; fy -= 1 }
  return { fy, period: Math.max(2, Math.min(12, p)) }
}

function fyStart(fy) { return `${fy - 1}-10-01` }
function fyEnd(fy)   { return `${fy}-09-30` }

// ── HTTP helpers ───────────────────────────────────────────────────

async function get(url, label = '') {
  console.log(`    GET ${label || url.replace('https://','').slice(0,80)}`)
  const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'FedFMMatter-DataPipeline/1.0' } })
  if (!r.ok) throw new Error(`${r.status}: ${await r.text().catch(() => '')}`.slice(0, 200))
  return r.json()
}

async function post(url, body, label = '') {
  console.log(`    POST ${label || url.replace('https://','').slice(0,80)}`)
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'FedFMMatter-DataPipeline/1.0' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`${r.status}: ${await r.text().catch(() => '')}`.slice(0, 200))
  return r.json()
}

// ── SOURCE 1: Object class breakdown ──────────────────────────────
// /agency/097/object_class/ → obligation by OMB object class
// Object class codes: 10=Personnel, 20=Contractual, 30=Acquisitions, etc.
async function fetchObjectClass(fy) {
  const data = await get(`${USA}/agency/${DOD}/object_class/?fiscal_year=${fy}&limit=100`, 'DoD object class obligations')

  // Also fetch the sub-object-class breakdown for contracts
  const contractSubOC = await post(`${USA}/search/spending_by_category/object_class/`, {
    filters: {
      agencies: [{ type: 'awarding', tier: 'toptier', name: 'Department of Defense' }],
      time_period: [{ start_date: fyStart(fy), end_date: fyEnd(fy) }],
    },
    limit: 40,
    page: 1,
  }, 'DoD spending by object class (awards)').catch(() => null)

  return { accountData: data, awardData: contractSubOC }
}

// ── SOURCE 2: Program activity breakdown ──────────────────────────
// /agency/097/program_activity/ → obligation by program activity within TAS
async function fetchProgramActivity(fy) {
  return get(`${USA}/agency/${DOD}/program_activity/?fiscal_year=${fy}&limit=100&sort=obligated_amount&order=desc`, 'DoD program activity obligations')
}

// ── SOURCE 3: File B async download (TAS × PA × OC × Period) ──────
// This is the SF-133 equivalent — the most granular account data
async function fetchFileB(fy, period) {
  console.log(`    Requesting File B async download (FY${fy} P${period})...`)

  // Kick off the download job
  const job = await post(`${USA}/bulk_download/accounts/`, {
    account_level: 'federal_account',
    filters: {
      agency: DOD,
      federal_account: null,
      budget_function: null,
      budget_subfunction: null,
      submission_types: ['account_breakdown_by_program_activity_object_class'],
      fy: String(fy),
      quarter: String(Math.ceil(period / 3)),
    },
    file_format: 'csv',
  }, 'File B bulk download request').catch(e => { console.warn(`    ⚠ File B request failed: ${e.message}`); return null })

  if (!job?.file_name) return null

  // Poll until ready (max 3 minutes)
  const statusUrl = `${USA}/bulk_download/status/?file_name=${encodeURIComponent(job.file_name)}`
  let fileUrl = null
  for (let i = 0; i < 36; i++) {
    await new Promise(r => setTimeout(r, 5000)) // wait 5s between polls
    const status = await get(statusUrl, `polling status (${i + 1}/36)`).catch(() => null)
    console.log(`      Status: ${status?.status} ${status?.percent_complete ?? ''}%`)
    if (status?.status === 'finished' && status?.file_url) { fileUrl = status.file_url; break }
    if (status?.status === 'failed') { console.warn(`    ⚠ File B download failed`); return null }
  }

  if (!fileUrl) { console.warn(`    ⚠ File B timed out`); return null }

  // Download the zip and extract the CSV
  console.log(`    Downloading File B from ${fileUrl}`)
  const r = await fetch(fileUrl)
  if (!r.ok) { console.warn(`    ⚠ File B download failed: ${r.status}`); return null }

  // The file is a ZIP — extract and parse first CSV
  const arrayBuf = await r.arrayBuffer()
  const buf = Buffer.from(arrayBuf)

  // Find local file header for first CSV (PK\x03\x04)
  let csvContent = ''
  try {
    // Simple ZIP parser — find first file entry
    const sig = Buffer.from([0x50, 0x4B, 0x03, 0x04])
    let offset = 0
    while (offset < buf.length - 4) {
      if (buf[offset] === sig[0] && buf[offset+1] === sig[1] && buf[offset+2] === sig[2] && buf[offset+3] === sig[3]) {
        const fnLen = buf.readUInt16LE(offset + 26)
        const extraLen = buf.readUInt16LE(offset + 28)
        const compSize = buf.readUInt32LE(offset + 18)
        const compMethod = buf.readUInt16LE(offset + 8)
        const dataStart = offset + 30 + fnLen + extraLen
        const filename = buf.slice(offset + 30, offset + 30 + fnLen).toString('utf8')
        console.log(`      Found file in ZIP: ${filename} (method=${compMethod}, size=${compSize})`)

        if (compMethod === 0) {
          // Stored (no compression)
          csvContent = buf.slice(dataStart, dataStart + compSize).toString('utf8')
          break
        } else if (compMethod === 8) {
          // Deflate
          const { inflateRaw } = await import('zlib')
          const compressed = buf.slice(dataStart, dataStart + compSize)
          csvContent = await new Promise((res, rej) =>
            inflateRaw(compressed, (err, result) => err ? rej(err) : res(result.toString('utf8')))
          )
          break
        }
        offset = dataStart + compSize
      } else {
        offset++
      }
    }
  } catch (e) {
    console.warn(`    ⚠ ZIP parse error: ${e.message}`)
    return null
  }

  return csvContent ? { content: csvContent, fileUrl } : null
}

// ── SOURCE 4: Treasury GTAS ────────────────────────────────────────
// Most authoritative SF-133 data — certified quarterly by agencies
async function fetchGTAS(fy, period) {
  const quarter = Math.ceil(period / 3)
  const url = `${GTAS}/gtas_budgetary_resources?` + new URLSearchParams({
    'fields': 'reporting_fiscal_year,reporting_fiscal_quarter,agency_identifier,main_account_code,budget_authority_appropriation_amt,obligations_incurred_by_program_object_class_cpe,gross_outlay_by_program_object_class_cpe,unobligated_balance_cpe',
    'filter': `reporting_fiscal_year:eq:${fy},reporting_fiscal_quarter:eq:${quarter},agency_identifier:eq:${DOD}`,
    'limit': '500',
    'offset': '0',
    'sort': '-obligations_incurred_by_program_object_class_cpe',
  })

  const data = await get(url, `Treasury GTAS FY${fy} Q${quarter} DoD`).catch(e => {
    console.warn(`    ⚠ GTAS: ${e.message}`)
    return null
  })
  return data
}

// ── SOURCE 5: Object class search (award-side detail) ─────────────
async function fetchAwardsByObjectClass(fy) {
  return post(`${USA}/search/spending_by_category/object_class/`, {
    filters: {
      agencies: [{ type: 'awarding', tier: 'toptier', name: 'Department of Defense' }],
      time_period: [{ start_date: fyStart(fy), end_date: fyEnd(fy) }],
    },
    limit: 50, page: 1,
  }, 'Award spending by object class').catch(() => null)
}

// ── Format content ─────────────────────────────────────────────────

const fmtB = v => v != null ? `$${(v/1e9).toFixed(2)}B` : 'N/A'
const fmtM = v => v != null ? `$${(v/1e6).toFixed(0)}M` : 'N/A'

// OMB object class descriptions
const OC_DESC = {
  '10': 'Personnel Compensation & Benefits', '11': 'Personnel Compensation',
  '12': 'Personnel Benefits', '13': 'Benefits for Former Personnel',
  '20': 'Contractual Services & Supplies', '21': 'Travel & Transportation of Persons',
  '22': 'Transportation of Things', '23': 'Rent, Communications & Utilities',
  '24': 'Printing & Reproduction', '25': 'Other Contractual Services',
  '26': 'Supplies & Materials', '31': 'Equipment', '32': 'Land & Structures',
  '33': 'Investments & Loans', '41': 'Grants/Fixed Charges', '42': 'Insurance Claims',
  '91': 'Unvouchered', '92': 'Undistributed', '99': 'Total',
}

function buildContent({ fy, period, objClass, programActivity, gtas, fileBSummary, awardsByOC }) {
  const quarter = Math.ceil(period / 3)
  const lines = [
    `# DoD SF-133 Level Obligation Data — FY${fy} Q${quarter} (Period ${period})`,
    `Sources: USASpending.gov (Object Class, Program Activity, File B) + Treasury GTAS`,
    `Pulled: ${new Date().toISOString().slice(0,10)} | Agency: Department of Defense (097)`,
    `Note: DoD data may lag up to 90 days per DATA Act policy`,
    '',
  ]

  // GTAS — most authoritative
  if (gtas?.data?.length) {
    lines.push(`## Treasury GTAS — Certified SF-133 Data (FY${fy} Q${quarter})`)
    lines.push(`Source: api.fiscal.treasury.gov/gtas_budgetary_resources (certified submissions)`)
    lines.push(`Records: ${gtas.data.length} TAS accounts`)
    const totObl = gtas.data.reduce((s, r) => s + (parseFloat(r.obligations_incurred_by_program_object_class_cpe) || 0), 0)
    const totBA = gtas.data.reduce((s, r) => s + (parseFloat(r.budget_authority_appropriation_amt) || 0), 0)
    const totOut = gtas.data.reduce((s, r) => s + (parseFloat(r.gross_outlay_by_program_object_class_cpe) || 0), 0)
    const totUnobl = gtas.data.reduce((s, r) => s + (parseFloat(r.unobligated_balance_cpe) || 0), 0)
    lines.push(`DoD Total Budget Authority (GTAS certified): ${fmtB(totBA)}`)
    lines.push(`DoD Total Obligations (GTAS certified): ${fmtB(totObl)}`)
    lines.push(`DoD Total Outlays (GTAS certified): ${fmtB(totOut)}`)
    lines.push(`DoD Unobligated Balance (GTAS certified): ${fmtB(totUnobl)}`)
    lines.push(`DoD Obligation Rate (GTAS): ${totBA ? ((totObl/totBA)*100).toFixed(1) : 'N/A'}%`)
    lines.push('')

    // Top TAS by obligation
    lines.push(`### Top GTAS Accounts by Obligations`)
    const sorted = [...gtas.data].sort((a, b) =>
      (parseFloat(b.obligations_incurred_by_program_object_class_cpe) || 0) -
      (parseFloat(a.obligations_incurred_by_program_object_class_cpe) || 0)
    )
    for (const r of sorted.slice(0, 25)) {
      const tas = `${r.agency_identifier}-${r.main_account_code}`
      const obl = parseFloat(r.obligations_incurred_by_program_object_class_cpe) || 0
      const ba = parseFloat(r.budget_authority_appropriation_amt) || 0
      const rate = ba ? ((obl/ba)*100).toFixed(0) : '?'
      lines.push(`- TAS ${tas}: Obligations ${fmtB(obl)} | BA ${fmtB(ba)} | Rate ${rate}%`)
    }
    lines.push('')
  }

  // Object class breakdown
  if (objClass?.results?.length) {
    lines.push(`## OMB Object Class Breakdown — FY${fy}`)
    lines.push(`Source: USASpending /agency/097/object_class/ (account-side, includes non-award spending)`)
    lines.push(`This maps to SF-133 Line Items by object class`)
    for (const oc of objClass.results) {
      const code = oc.object_class || oc.major_object_class
      const desc = OC_DESC[code] ?? OC_DESC[String(code).slice(0,2)] ?? oc.object_class_name ?? ''
      const obl = oc.obligated_amount || oc.gross_outlay_amount || oc.direct_obligation || 0
      lines.push(`- OC ${code} (${desc}): ${fmtB(obl)}`)
    }
    lines.push(`Total account-side object class obligations: ${fmtB(objClass.totals?.obligated_amount)}`)
    lines.push('')
  }

  // Award-side object class
  if (awardsByOC?.results?.length) {
    lines.push(`## Award-Side Object Class Breakdown — FY${fy}`)
    lines.push(`Source: USASpending award search (contract/grant transactions only)`)
    for (const oc of awardsByOC.results.slice(0, 20)) {
      const desc = OC_DESC[oc.code] ?? OC_DESC[String(oc.code || '').slice(0,2)] ?? oc.name ?? ''
      lines.push(`- OC ${oc.code} (${desc ?? oc.name}): ${fmtB(oc.aggregated_amount)} | ${oc.transaction_count?.toLocaleString() ?? '?'} transactions`)
    }
    lines.push('')
  }

  // Program activity
  if (programActivity?.results?.length) {
    lines.push(`## Program Activity Breakdown — FY${fy}`)
    lines.push(`Source: USASpending /agency/097/program_activity/ (account-side)`)
    lines.push(`Program Activity is the link between appropriation accounts and budget justification line items`)
    for (const pa of programActivity.results.slice(0, 30)) {
      const tas = pa.tas_account_id ? ` [TAS ${pa.tas_account_id}]` : ''
      lines.push(`- PA ${pa.program_activity_code} "${pa.program_activity_name}"${tas}: Obligations ${fmtB(pa.obligated_amount)} | Outlays ${fmtB(pa.gross_outlay_amount)}`)
    }
    lines.push(`Total program activity records: ${programActivity.page_metadata?.total ?? 'N/A'}`)
    lines.push('')
  }

  // File B summary
  if (fileBSummary) {
    lines.push(`## File B Summary — TAS × Program Activity × Object Class`)
    lines.push(`Source: USASpending bulk_download/accounts/ — SF-133 equivalent`)
    lines.push(fileBSummary)
    lines.push('')
  }

  lines.push(`## Analysis Context`)
  lines.push(`Fiscal Year: ${fy} | Period: ${period}/12 (${Math.round(period/12*100)}% through FY)`)
  lines.push(`Object class 25 (Services) and 31 (Equipment) are primary indicators of contract obligations`)
  lines.push(`Object class 11/12 (Personnel) obligations are driven by MILPERS appropriation end-strength`)
  lines.push(`GTAS data is certified quarterly — most authoritative for SF-133 reconciliation`)
  lines.push(`USASpending File B provides program activity × object class cross-walk for OMB MAX reporting`)

  return lines.join('\n')
}

// ── Summarize File B CSV ───────────────────────────────────────────

function summarizeFileB(csvText) {
  if (!csvText) return null
  const lines = csvText.split('\n').filter(Boolean)
  if (lines.length < 2) return null
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())

  // Find key column indices
  const idx = h => headers.findIndex(hdr => hdr.toLowerCase().includes(h.toLowerCase()))
  const iObl = idx('obligation'); const iPA = idx('program_activity'); const iOC = idx('object_class')
  const iOut = idx('outlay'); const iTAS = idx('treasury_account_symbol') !== -1 ? idx('treasury_account_symbol') : idx('tas')

  if (iObl < 0) return `File B headers: ${headers.slice(0,10).join(', ')}...\nTotal rows: ${lines.length - 1}`

  // Parse and summarize
  const byOC: Record<string, number> = {}
  const byPA: Record<string, number> = {}
  let totalObl = 0; let totalOut = 0

  for (const line of lines.slice(1, 5001)) { // cap at 5000 rows for memory
    const cols = line.split(',').map(c => c.replace(/"/g, '').trim())
    const obl = parseFloat(cols[iObl]) || 0
    const out = iOut >= 0 ? parseFloat(cols[iOut]) || 0 : 0
    const oc = iOC >= 0 ? cols[iOC] : 'Unknown'
    const pa = iPA >= 0 ? cols[iPA] : 'Unknown'
    totalObl += obl; totalOut += out
    byOC[oc] = (byOC[oc] || 0) + obl
    byPA[pa] = (byPA[pa] || 0) + obl
  }

  const summary = [
    `File B rows parsed: ${lines.length - 1} (TAS × Program Activity × Object Class records)`,
    `Total obligations in File B: ${fmtB(totalObl)}`,
    `Total outlays in File B: ${fmtB(totalOut)}`,
    ``,
    `Object class breakdown from File B:`,
    ...Object.entries(byOC).sort((a,b) => b[1]-a[1]).slice(0,15)
      .map(([oc, amt]) => `  OC ${oc}: ${fmtB(amt)}`),
    ``,
    `Top program activities from File B:`,
    ...Object.entries(byPA).sort((a,b) => b[1]-a[1]).slice(0,15)
      .map(([pa, amt]) => `  ${pa}: ${fmtB(amt)}`),
  ]
  return summary.join('\n')
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
  const { fy, period } = laggedPeriod(2)
  const label = `FY${fy}_P${String(period).padStart(2,'0')}`

  console.log(`\n🔄 DoD SF-133 Level Obligation Data Pull`)
  console.log(`   FY${fy} Period ${period} (Q${Math.ceil(period/3)})`)
  console.log(`   ${new Date().toISOString()}\n`)

  // ── Fetch all sources (non-fatal failures) ─────────────────────
  console.log('── Source 1: Object Class Breakdown ─────────────────────')
  const objClassRaw = await fetchObjectClass(fy).catch(e => { console.warn(`  ⚠ ${e.message}`); return null })

  console.log('\n── Source 2: Program Activity Breakdown ─────────────────')
  const programActivity = await fetchProgramActivity(fy).catch(e => { console.warn(`  ⚠ ${e.message}`); return null })

  console.log('\n── Source 4: Treasury GTAS (certified SF-133) ───────────')
  const gtas = await fetchGTAS(fy, period)

  console.log('\n── Source 5: Award-Side Object Class ────────────────────')
  const awardsByOC = await fetchAwardsByObjectClass(fy)

  // File B is large and async — attempt it but don't block on failure
  console.log('\n── Source 3: File B Async Download (SF-133 equivalent) ──')
  const fileB = await fetchFileB(fy, period)
  const fileBSummary = fileB ? summarizeFileB(fileB.content) : null

  // ── Ingest File B raw CSV separately if we got it ──────────────
  if (fileB?.content) {
    const fbFilename = `usaspending_dod_file_b_${label}.csv`
    try {
      await ingest(fbFilename, fileB.content.slice(0, 500000), 'dod_file_b', label)
    } catch (e) { console.warn(`  ⚠ File B ingest failed: ${e.message}`) }
  }

  // ── Build and ingest main summary ─────────────────────────────
  const content = buildContent({
    fy, period,
    objClass: objClassRaw?.accountData,
    programActivity,
    gtas,
    fileBSummary,
    awardsByOC,
  })

  const filename = `usaspending_dod_obligations_${label}.txt`
  const result = await ingest(filename, content, 'dod_obligations', label)

  const sources = [objClassRaw, programActivity, gtas, awardsByOC].filter(Boolean).length
  console.log(`\n✓ Done — ${sources}/4 sources ingested, ${fileB ? 'File B included' : 'File B skipped'}`)
  return result
}

main().catch(err => { console.error('\n❌ Fatal:', err.message); process.exit(1) })
