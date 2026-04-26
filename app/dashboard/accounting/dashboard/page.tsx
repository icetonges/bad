'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, RefreshCw, ArrowLeft, TrendingDown, Coins, BarChart3, FileText, Download } from 'lucide-react'

declare global { interface Window { Chart: any } }

interface DashboardData {
  summary: { fy: number; period: number; label: string; total_ba: number; total_obligations: number; total_outlays: number; obligation_rate: number }
  multiYearChart: Array<{ year: string; budgetary_resources: number; obligations: number; outlays: number; obligation_rate: number }>
  categoryChart:  Array<{ category: string; amount_b: number; transactions: number }>
  componentChart: Array<{ agency: string; full_name: string; obligations_m: number; diff_m: number }>
  tasChart:       Array<{ account: string; account_name: string; amount_b: number }>
  topAwards:      Array<{ recipient: string; sub_agency: string; award_type: string; amount_m: number }>
  pulled_at: string
}

const COLORS = ['#1E5AA8','#D4AF37','#D4883A','#C04B2D','#5B4BC4','#4C9C6F','#888780','#1D9E75','#E07B3A','#6B4BC4','#3B6D11','#A32D2D','#1E88C4','#C4881E','#884BC4']

function fmtB(v: number | null) { return v != null ? `$${(v/1e9).toFixed(1)}B` : '—' }
function fmtM(v: number | null) { return v != null ? `$${v.toLocaleString()}M` : '—' }
function fmtPct(v: number | null) { return v != null ? `${(v*100).toFixed(1)}%` : '—' }

function useChartJS(cb: () => (() => void) | void, deps: any[]) {
  const loaded = useRef(false)
  useEffect(() => {
    function init() { const cleanup = cb(); return cleanup }
    if ((window as any).Chart) { loaded.current = true; return init() }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    s.onload = () => { loaded.current = true; init() }
    document.head.appendChild(s)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

function ChartBox({ id, title, sub, children }: { id: string; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3">
        <p className="text-sm font-medium">{title}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      {children}
      <div style={{ height: 260, position: 'relative' }}>
        <canvas id={id} />
      </div>
    </div>
  )
}

export default function ObligationDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const chartRefs = useRef<Record<string, any>>({})

  function destroyChart(id: string) {
    if (chartRefs.current[id]) { chartRefs.current[id].destroy(); delete chartRefs.current[id] }
  }

  function makeChart(id: string, config: any) {
    destroyChart(id)
    const canvas = document.getElementById(id) as HTMLCanvasElement
    if (!canvas || !(window as any).Chart) return
    chartRefs.current[id] = new (window as any).Chart(canvas, config)
  }

  async function load() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/obligation-dashboard')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'API error')
      setData(json)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const gridC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const tickC = isDark ? '#9c9a92' : '#73726c'
  const scaleBase = { grid: { color: gridC }, ticks: { color: tickC, font: { size: 11 } } }

  // Multi-year chart
  useChartJS(() => {
    if (!data?.multiYearChart.length) return
    makeChart('c-multiyear', {
      type: 'bar',
      data: {
        labels: data.multiYearChart.map(d => d.year),
        datasets: [
          { label: 'Budget Authority ($B)', data: data.multiYearChart.map(d => d.budgetary_resources), backgroundColor: '#1E5AA8' },
          { label: 'Obligations ($B)', data: data.multiYearChart.map(d => d.obligations), backgroundColor: '#D4AF37' },
          { label: 'Outlays ($B)', data: data.multiYearChart.map(d => d.outlays), backgroundColor: '#4C9C6F' },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: tickC, font: { size: 11 } } } }, scales: { x: scaleBase, y: { ...scaleBase, ticks: { ...scaleBase.ticks, callback: (v: number) => `$${v}B` } } } },
    })
  }, [data])

  // Obligation rate trend
  useChartJS(() => {
    if (!data?.multiYearChart.length) return
    makeChart('c-rate', {
      type: 'line',
      data: {
        labels: data.multiYearChart.map(d => d.year),
        datasets: [{ label: 'Obligation Rate %', data: data.multiYearChart.map(d => d.obligation_rate), borderColor: '#D4883A', backgroundColor: 'rgba(212,136,58,0.1)', fill: true, tension: 0.3 }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: scaleBase, y: { ...scaleBase, min: 0, max: 100, ticks: { ...scaleBase.ticks, callback: (v: number) => `${v}%` } } } },
    })
  }, [data])

  // Award category pie
  useChartJS(() => {
    if (!data?.categoryChart.length) return
    makeChart('c-category', {
      type: 'doughnut',
      data: {
        labels: data.categoryChart.map(d => d.category),
        datasets: [{ data: data.categoryChart.map(d => d.amount_b), backgroundColor: COLORS }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: tickC, font: { size: 10 }, boxWidth: 10 } } } },
    })
  }, [data])

  // DoD component obligations
  useChartJS(() => {
    if (!data?.componentChart.length) return
    const top = data.componentChart.slice(0, 12)
    makeChart('c-component', {
      type: 'bar',
      data: {
        labels: top.map(d => d.agency),
        datasets: [{ label: 'Obligations ($M)', data: top.map(d => d.obligations_m), backgroundColor: COLORS }],
      },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ...scaleBase, ticks: { ...scaleBase.ticks, callback: (v: number) => `$${v}M` } }, y: { grid: { display: false }, ticks: { color: tickC, font: { size: 10 } } } } },
    })
  }, [data])

  // TAS federal accounts
  useChartJS(() => {
    if (!data?.tasChart.length) return
    const top = data.tasChart.slice(0, 12)
    makeChart('c-tas', {
      type: 'bar',
      data: {
        labels: top.map(d => d.account.length > 20 ? d.account.slice(0, 20) + '…' : d.account),
        datasets: [{ label: 'Obligations ($B)', data: top.map(d => d.amount_b), backgroundColor: '#5B4BC4' }],
      },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ...scaleBase, ticks: { ...scaleBase.ticks, callback: (v: number) => `$${v}B` } }, y: { grid: { display: false }, ticks: { color: tickC, font: { size: 10 } } } } },
    })
  }, [data])

  // Top contractors
  useChartJS(() => {
    if (!data?.topAwards.length) return
    const top = data.topAwards.slice(0, 12)
    makeChart('c-contractors', {
      type: 'bar',
      data: {
        labels: top.map(d => d.recipient.length > 25 ? d.recipient.slice(0, 25) + '…' : d.recipient),
        datasets: [{ label: 'Award ($M)', data: top.map(d => d.amount_m), backgroundColor: '#C04B2D' }],
      },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ...scaleBase, ticks: { ...scaleBase.ticks, callback: (v: number) => `$${v}M` } }, y: { grid: { display: false }, ticks: { color: tickC, font: { size: 10 } } } } },
    })
  }, [data])

  function exportCSV() {
    if (!data) return
    const rows = [
      ['Section', 'Label', 'Value'],
      ...data.multiYearChart.map(d => ['Multi-Year', d.year, `BA $${d.budgetary_resources}B Obligations $${d.obligations}B Outlays $${d.outlays}B Rate ${d.obligation_rate}%`]),
      ...data.categoryChart.map(d => ['Award Category', d.category, `$${d.amount_b}B (${d.transactions} transactions)`]),
      ...data.componentChart.map(d => ['DoD Component', d.full_name, `$${d.obligations_m}M`]),
      ...data.tasChart.map(d => ['Federal Account (TAS)', d.account, `$${d.amount_b}B`]),
      ...data.topAwards.map(d => ['Top Contractor', d.recipient, `$${d.amount_m}M (${d.sub_agency})`]),
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `dod_obligations_${data.summary.label}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading live USASpending data…</div>
  if (error) return (
    <div className="p-8">
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 flex items-start gap-3 max-w-xl">
        <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
        <div>
          <p className="text-sm font-medium mb-1">Could not load obligation data</p>
          <p className="text-xs text-muted-foreground mb-3">{error}</p>
          <button onClick={load} className="text-xs text-gold hover:text-primary transition">Retry →</button>
        </div>
      </div>
    </div>
  )
  if (!data) return null

  const { summary } = data
  return (
    <div className="p-6 max-w-7xl w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/dashboard/accounting" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3 w-3" /> Accounting & Execution
          </Link>
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold mb-1">Live · {summary.label}</p>
          <h1 className="text-2xl font-medium tracking-tight">DoD Obligation Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">Source: USASpending.gov · Pulled {new Date(data.pulled_at).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 text-xs border border-border rounded px-3 py-1.5 text-muted-foreground hover:text-foreground transition">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs border border-border rounded px-3 py-1.5 text-muted-foreground hover:text-gold transition">
            <Download className="h-3 w-3" /> Export CSV
          </button>
          <Link href={`/dashboard/chat?category=accounting&prompt=${encodeURIComponent('Analyze the latest DoD obligation data from USASpending.gov. Cover: total BA vs obligations vs outlays, obligation rate vs historical, top funding categories, which DoD components are leading, top contractors, and any execution risks.')}`}
            className="flex items-center gap-1.5 text-xs border border-primary/60 text-gold rounded px-3 py-1.5 hover:bg-accent transition">
            Ask agent →
          </Link>
        </div>
      </div>

      {/* Summary metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Metric label="Total budget authority" value={fmtB(summary.total_ba)} icon={Coins} />
        <Metric label="Total obligations" value={fmtB(summary.total_obligations)} icon={TrendingDown} />
        <Metric label="Total outlays" value={fmtB(summary.total_outlays)} icon={BarChart3} />
        <Metric label="Obligation rate" value={fmtPct(summary.obligation_rate)} icon={FileText} tone={summary.obligation_rate < 0.6 ? 'warn' : 'ok'} />
      </div>

      {/* Interpretation banner */}
      <div className="rounded-lg border border-border bg-card p-4 mb-6 text-sm">
        <p className="font-medium mb-1">Execution reading — {summary.label}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {summary.obligation_rate != null && summary.obligation_rate < 0.5
            ? `⚠️ Obligation rate of ${fmtPct(summary.obligation_rate)} is below 50% at period ${summary.period} — back-loading risk. Expect Q4 spike and potential carryover. Review ADA exposure on near-expiring accounts.`
            : summary.obligation_rate != null && summary.obligation_rate >= 0.8
            ? `✓ Obligation rate of ${fmtPct(summary.obligation_rate)} is on track for end-of-year execution. Monitor outlays lag — ${fmtB(summary.total_obligations ? summary.total_obligations - (summary.total_outlays ?? 0) : null)} in ULO (obligated not yet outlayed).`
            : `Obligation rate: ${fmtPct(summary.obligation_rate)} at period ${summary.period} of 12. ULO gap: ${fmtB(summary.total_obligations && summary.total_outlays ? summary.total_obligations - summary.total_outlays : null)}.`
          }
        </p>
      </div>

      {/* Charts grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <ChartBox id="c-multiyear" title="Multi-year BA / Obligations / Outlays ($B)" sub="Budget Authority vs actual obligations vs cash outlays — 4 fiscal years" />
        <ChartBox id="c-rate" title="Obligation rate trend (%)" sub="Obligations as % of total budget authority by fiscal year" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <ChartBox id="c-category" title="Obligations by award type" sub={`FY${summary.fy} — contracts, grants, direct payments, IDVs`} />
        <ChartBox id="c-component" title="Top DoD components by obligations ($M)" sub="From GTAS reporting submissions — agency-level" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <ChartBox id="c-tas" title="Obligations by federal account (TAS) ($B)" sub="Top 12 Treasury Appropriation Fund Symbols by dollar obligation" />
        <ChartBox id="c-contractors" title="Top DoD contractors by award amount ($M)" sub={`FY${summary.fy} — contracts A/B/C/D only, sorted by total obligation`} />
      </div>

      {/* TAS detail table */}
      {data.tasChart.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 mb-4">
          <p className="text-sm font-medium mb-3">Federal account (TAS) detail</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left pb-2 pr-4">Account code (TAS)</th>
                  <th className="text-left pb-2 pr-4">Account name</th>
                  <th className="text-right pb-2">Obligations ($B)</th>
                </tr>
              </thead>
              <tbody>
                {data.tasChart.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-1.5 pr-4 font-mono text-[11px]">{row.account}</td>
                    <td className="py-1.5 pr-4 text-muted-foreground">{row.account_name}</td>
                    <td className="py-1.5 text-right font-medium">{fmtB(row.amount_b * 1e9)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top contractors table */}
      {data.topAwards.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium mb-3">Top contractor awards</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left pb-2 pr-4">Recipient</th>
                  <th className="text-left pb-2 pr-4">Sub-agency</th>
                  <th className="text-left pb-2 pr-4">Type</th>
                  <th className="text-right pb-2">Amount ($M)</th>
                </tr>
              </thead>
              <tbody>
                {data.topAwards.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-1.5 pr-4 font-medium">{row.recipient}</td>
                    <td className="py-1.5 pr-4 text-muted-foreground">{row.sub_agency}</td>
                    <td className="py-1.5 pr-4 text-muted-foreground">{row.award_type}</td>
                    <td className="py-1.5 text-right font-medium">{fmtM(row.amount_m)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-4">
        Data: USASpending.gov API · No authentication required · Auto-refreshed weekly via GitHub Actions · All figures in nominal dollars
      </p>
    </div>
  )
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone?: 'ok' | 'warn' }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className={`text-2xl font-medium tracking-tight ${tone === 'warn' ? 'text-gold' : tone === 'ok' ? 'text-green-600' : ''}`}>{value}</div>
    </div>
  )
}
