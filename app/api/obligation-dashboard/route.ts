import { NextRequest, NextResponse } from 'next/server'
import { sql, DEFAULT_WORKSPACE_ID } from '@/lib/db/neon'

export const runtime = 'nodejs'
export const maxDuration = 30

const BASE = 'https://api.usaspending.gov/api/v2'
const DOD = '097'

function lagPeriod() {
  const now = new Date()
  const month = now.getMonth() + 1
  let p = month >= 10 ? month - 9 : month + 3
  let fy = month >= 10 ? now.getFullYear() + 1 : now.getFullYear()
  p -= 2
  if (p < 2) { p += 12; fy -= 1 }
  return { fy, period: Math.max(2, Math.min(12, p)) }
}

async function get(path: string) {
  const r = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}`)
  return r.json()
}

async function post(path: string, body: unknown) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`POST ${path} → ${r.status}`)
  return r.json()
}

export async function GET(req: NextRequest) {
  const { fy: currentFY, period } = lagPeriod()
  const years = [currentFY - 3, currentFY - 2, currentFY - 1, currentFY]
  const requestedFY = parseInt(req.nextUrl.searchParams.get('fy') ?? String(currentFY))

  try {
    // ── Parallel fetches ───────────────────────────────────────────
    const [tasRes, prevTasRes, categoryRes, overviewRes, awardsRes] = await Promise.allSettled([
      // TAS/federal account data for selected FY (has obligated_amount, total_budgetary_resources, gross_outlay_amount)
      get(`/agency/${DOD}/federal_account/?fiscal_year=${requestedFY}&limit=25&sort=obligated_amount&order=desc`),
      // Same for prior FY (for YoY comparison)
      get(`/agency/${DOD}/federal_account/?fiscal_year=${requestedFY - 1}&limit=25&sort=obligated_amount&order=desc`),
      // Obligations by award category
      get(`/agency/${DOD}/obligations_by_award_category/?fiscal_year=${requestedFY}`),
      // Agency reporting overview — component breakdown
      get(`/reporting/agencies/overview/?fiscal_year=${currentFY}&fiscal_period=${period}&filter=defense&limit=30`),
      // Top DoD contract awards
      post('/search/spending_by_award/', {
        filters: {
          agencies: [{ type: 'awarding', tier: 'toptier', name: 'Department of Defense' }],
          time_period: [{ start_date: `${requestedFY - 1}-10-01`, end_date: `${requestedFY}-09-30` }],
          award_type_codes: ['A', 'B', 'C', 'D'],
        },
        fields: ['Award ID', 'Recipient Name', 'Award Amount', 'Awarding Sub Agency', 'Award Type', 'NAICS Code', 'Description'],
        sort: 'Award Amount', order: 'desc', limit: 30, page: 1,
      }),
    ])

    const ok = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null
    const tas = ok(tasRes)
    const prevTas = ok(prevTasRes)
    const category = ok(categoryRes)
    const overview = ok(overviewRes)
    const awards = ok(awardsRes)

    // ── Multi-year summary ─────────────────────────────────────────
    // Fetch summary for each year from federal_account totals
    const multiYearRaw = await Promise.allSettled(
      years.map(y => get(`/agency/${DOD}/federal_account/?fiscal_year=${y}&limit=1`))
    )
    const multiYearChart = years.map((y, i) => {
      const d = multiYearRaw[i].status === 'fulfilled' ? multiYearRaw[i].value : null
      const t = d?.totals ?? {}
      const ba  = t.total_budgetary_resources ?? null
      const obl = t.obligated_amount ?? null   // correct field
      const out = t.gross_outlay_amount ?? null
      return {
        year: `FY${y}`, fy: y,
        budgetary_resources_b: ba  ? +(ba  / 1e9).toFixed(1) : null,
        obligations_b:         obl ? +(obl / 1e9).toFixed(1) : null,
        outlays_b:             out ? +(out / 1e9).toFixed(1) : null,
        obligation_rate: ba && obl ? +((obl / ba) * 100).toFixed(1) : null,
        outlay_rate:     ba && out ? +((out / ba) * 100).toFixed(1) : null,
      }
    }).filter(d => d.budgetary_resources_b != null)

    // ── Current FY summary ─────────────────────────────────────────
    const totals = tas?.totals ?? {}
    // federal_account endpoint uses obligated_amount (not total_obligations)
    const ba  = totals.total_budgetary_resources ?? null
    const obl = totals.obligated_amount ?? null
    const out = totals.gross_outlay_amount ?? null
    const summary = {
      fy: requestedFY,
      period,
      label: `FY${requestedFY} P${String(period).padStart(2, '0')}`,
      total_ba:          ba,
      total_obligations: obl,
      total_outlays:     out,
      obligation_rate:   ba && obl ? obl / ba : null,
      outlay_rate:       ba && out ? out / ba : null,
      ulo:               obl && out ? obl - out : null,
    }

    // ── TAS breakdown ──────────────────────────────────────────────
    const prevMap: Record<string, any> = {}
    for (const r of prevTas?.results ?? []) prevMap[r.code] = r

    const tasChart = (tas?.results ?? []).slice(0, 20).map((r: any) => {
      const prev = prevMap[r.code]
      const oblCur = r.obligated_amount ?? 0
      const oblPrev = prev?.obligated_amount ?? null
      return {
        code: r.code,
        name: r.name,
        fund_type: classifyTAS(r.code),
        total_ba_b: r.total_budgetary_resources ? +(r.total_budgetary_resources / 1e9).toFixed(2) : 0,
        obligations_b: +(oblCur / 1e9).toFixed(2),
        outlays_b: r.gross_outlay_amount ? +(r.gross_outlay_amount / 1e9).toFixed(2) : 0,
        obligation_rate: r.total_budgetary_resources && oblCur
          ? +((oblCur / r.total_budgetary_resources) * 100).toFixed(1) : null,
        yoy_delta_b: oblPrev != null ? +((oblCur - oblPrev) / 1e9).toFixed(2) : null,
        yoy_pct: oblPrev ? +((oblCur - oblPrev) / oblPrev * 100).toFixed(1) : null,
      }
    })

    // ── Award category ─────────────────────────────────────────────
    const categoryChart = (category?.results ?? []).map((c: any) => ({
      category: c.category?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) ?? '',
      amount_b: c.aggregated_amount ? +(c.aggregated_amount / 1e9).toFixed(1) : 0,
      transactions: c.transaction_count ?? 0,
    })).filter((c: any) => c.amount_b > 0).sort((a: any, b: any) => b.amount_b - a.amount_b)

    // ── Component breakdown ────────────────────────────────────────
    const componentChart = (overview?.results ?? [])
      .filter((a: any) => a.current_total_budget_authority_amount > 1e9)
      .slice(0, 15)
      .map((a: any) => ({
        agency: a.abbreviation || (a.agency_name ?? '').split(' ').slice(-2).join(' '),
        full_name: a.agency_name,
        ba_b: a.current_total_budget_authority_amount
          ? +(a.current_total_budget_authority_amount / 1e9).toFixed(1) : 0,
        gtas_obl_m: a.tas_account_discrepancies_totals?.gtas_obligation_total
          ? +(a.tas_account_discrepancies_totals.gtas_obligation_total / 1e6).toFixed(0) : 0,
        discrepancy_m: a.obligation_difference
          ? +(a.obligation_difference / 1e6).toFixed(0) : 0,
      }))
      .sort((a: any, b: any) => b.ba_b - a.ba_b)

    // ── Top contractors ────────────────────────────────────────────
    const topAwards = (awards?.results ?? []).map((a: any) => ({
      recipient: a['Recipient Name'] ?? 'Unknown',
      sub_agency: (a['Awarding Sub Agency'] ?? '').replace('Department of Defense', 'DoD').trim(),
      award_type: a['Award Type'] ?? '',
      naics: a['NAICS Code'] ?? '',
      amount_m: a['Award Amount'] ? +(a['Award Amount'] / 1e6).toFixed(0) : 0,
    })).filter((a: any) => a.amount_m > 0)

    // ── Raw ingested file from DB ──────────────────────────────────
    let rawFile: { filename: string; content: string; storage_url: string; pulled_at: string } | null = null
    try {
      const docs = await sql`
        select d.filename, d.storage_url, d.created_at,
               string_agg(c.content, E'\n' order by c.chunk_index) as content
        from public.documents d
        join public.chunks c on c.document_id = d.id
        where d.metadata->>'auto_ingested' = 'true'
          and d.category = 'accounting'
        group by d.id
        order by d.created_at desc
        limit 1
      `
      if (docs.length) {
        rawFile = {
          filename: (docs[0] as any).filename,
          content: (docs[0] as any).content ?? '',
          storage_url: (docs[0] as any).storage_url,
          pulled_at: (docs[0] as any).created_at,
        }
      }
    } catch {}

    // ── Available FYs from DB ──────────────────────────────────────
    let availableFiles: Array<{ filename: string; created_at: string; storage_url: string }> = []
    try {
      const rows = await sql`
        select filename, created_at, storage_url from public.documents
        where metadata->>'auto_ingested' = 'true' and category = 'accounting'
        order by created_at desc limit 10
      `
      availableFiles = rows as any[]
    } catch {}

    return NextResponse.json({
      summary, multiYearChart, tasChart, categoryChart, componentChart, topAwards,
      rawFile, availableFiles,
      pulled_at: new Date().toISOString(),
      requestedFY,
      availableFYs: years,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Classify TAS by fund type based on code pattern
function classifyTAS(code: string): string {
  if (!code) return 'Other'
  const upper = code.toUpperCase()
  if (upper.includes('-X-'))  return 'No-Year'
  if (upper.match(/-\d{4}\/\d{4}-/)) return '2-Year'
  if (upper.match(/-\d{4}-/)) return '1-Year'
  if (upper.includes('WCF') || upper.includes('DWCF')) return 'Working Capital'
  return 'Multi-Year'
}
