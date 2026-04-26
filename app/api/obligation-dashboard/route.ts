import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const BASE = 'https://api.usaspending.gov/api/v2'
const DOD_CODE = '097'

function getFiscalYears() {
  const now = new Date()
  const currentFY = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear()
  return [currentFY - 3, currentFY - 2, currentFY - 1, currentFY]
}

function getLaggedPeriod() {
  const now = new Date()
  const month = now.getMonth() + 1
  let fyPeriod = month >= 10 ? month - 9 : month + 3
  let fy = month >= 10 ? now.getFullYear() + 1 : now.getFullYear()
  fyPeriod -= 2
  if (fyPeriod < 2) { fyPeriod += 12; fy -= 1 }
  fyPeriod = Math.max(2, Math.min(12, fyPeriod))
  return { fy, period: fyPeriod }
}

async function get(path: string) {
  const r = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } })
  if (!r.ok) throw new Error(`${r.status} ${path}`)
  return r.json()
}

async function post(path: string, body: unknown) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    next: { revalidate: 3600 }
  })
  if (!r.ok) throw new Error(`${r.status} ${path}`)
  return r.json()
}

export async function GET(_req: NextRequest) {
  try {
    const years = getFiscalYears()
    const { fy: currentFY, period } = getLaggedPeriod()

    // Fetch in parallel
    const [multiYearRes, categoryRes, overviewRes, topContractsRes, federalAccountsRes] = await Promise.allSettled([
      // Multi-year budgetary resources
      get(`/agency/${DOD_CODE}/budgetary_resources/`),

      // Obligations by award category (current FY)
      get(`/agency/${DOD_CODE}/obligations_by_award_category/?fiscal_year=${currentFY}`),

      // Agency reporting overview with DoD filter
      get(`/reporting/agencies/overview/?fiscal_year=${currentFY}&fiscal_period=${period}&filter=defense&limit=30`),

      // Top 50 DoD contracts
      post('/search/spending_by_award/', {
        filters: {
          agencies: [{ type: 'awarding', tier: 'toptier', name: 'Department of Defense' }],
          time_period: [{ start_date: `${currentFY - 1}-10-01`, end_date: `${currentFY}-09-30` }],
          award_type_codes: ['A', 'B', 'C', 'D'],
        },
        fields: ['Award ID', 'Recipient Name', 'Award Amount', 'Awarding Sub Agency', 'Award Type', 'NAICS Code', 'Description'],
        sort: 'Award Amount', order: 'desc', limit: 20, page: 1,
      }),

      // Federal accounts (TAS breakdown) for DoD
      post('/search/spending_by_category/federal_account/', {
        filters: {
          agencies: [{ type: 'awarding', tier: 'toptier', name: 'Department of Defense' }],
          time_period: [{ start_date: `${currentFY - 1}-10-01`, end_date: `${currentFY}-09-30` }],
        },
        limit: 20,
        page: 1,
      }),
    ])

    const unwrap = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null

    const multiYear = unwrap(multiYearRes)
    const category = unwrap(categoryRes)
    const overview = unwrap(overviewRes)
    const topContracts = unwrap(topContractsRes)
    const federalAccounts = unwrap(federalAccountsRes)

    // Build multi-year trend from agency data
    const byYear = multiYear?.agency_data_by_year ?? []
    const multiYearChart = years.map(y => {
      const row = byYear.find((d: any) => d.fiscal_year === y)
      return {
        year: `FY${y}`,
        budgetary_resources: row ? Math.round(row.total_budgetary_resources / 1e9) : null,
        obligations: row ? Math.round(row.total_obligations / 1e9) : null,
        outlays: row ? Math.round(row.total_outlays / 1e9) : null,
        obligation_rate: row && row.total_budgetary_resources
          ? Math.round(row.total_obligations / row.total_budgetary_resources * 100)
          : null,
      }
    }).filter(d => d.budgetary_resources != null)

    // Current period summary
    const currentRow = byYear.find((d: any) => d.fiscal_year === currentFY) ?? byYear[0]
    const summary = {
      fy: currentFY,
      period,
      label: `FY${currentFY} P${String(period).padStart(2, '0')}`,
      total_ba: currentRow?.total_budgetary_resources ?? null,
      total_obligations: currentRow?.total_obligations ?? null,
      total_outlays: currentRow?.total_outlays ?? null,
      obligation_rate: currentRow?.total_budgetary_resources
        ? currentRow.total_obligations / currentRow.total_budgetary_resources
        : null,
    }

    // Award category breakdown
    const categoryChart = (category?.results ?? []).map((c: any) => ({
      category: c.category?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) ?? c.category,
      amount_b: Math.round((c.aggregated_amount ?? 0) / 1e9 * 10) / 10,
      transactions: c.transaction_count ?? 0,
    })).filter((c: any) => c.amount_b > 0)

    // DoD component breakdown from reporting overview
    const componentChart = (overview?.results ?? [])
      .filter((a: any) => a.tas_account_discrepancies_totals?.gtas_obligation_total > 0)
      .slice(0, 15)
      .map((a: any) => ({
        agency: a.abbreviation || a.agency_name?.split(' ').slice(-2).join(' ') || 'Unknown',
        full_name: a.agency_name,
        obligations_m: Math.round((a.tas_account_discrepancies_totals?.gtas_obligation_total ?? 0) / 1e6),
        diff_m: Math.round((a.obligation_difference ?? 0) / 1e6),
      }))
      .sort((a: any, b: any) => b.obligations_m - a.obligations_m)

    // Federal accounts (TAS) breakdown
    const tasChart = (federalAccounts?.results ?? []).slice(0, 15).map((a: any) => ({
      account: a.code || a.account_title || 'Unknown',
      account_name: a.account_title || a.name || '',
      amount_b: Math.round((a.aggregated_amount ?? 0) / 1e9 * 10) / 10,
    })).filter((a: any) => a.amount_b > 0)

    // Top contractors
    const topAwards = (topContracts?.results ?? []).slice(0, 15).map((a: any) => ({
      recipient: a['Recipient Name'] ?? 'Unknown',
      sub_agency: a['Awarding Sub Agency'] ?? 'DoD',
      award_type: a['Award Type'] ?? '',
      amount_m: Math.round((a['Award Amount'] ?? 0) / 1e6),
    })).filter((a: any) => a.amount_m > 0)

    return NextResponse.json({
      summary,
      multiYearChart,
      categoryChart,
      componentChart,
      tasChart,
      topAwards,
      pulled_at: new Date().toISOString(),
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
