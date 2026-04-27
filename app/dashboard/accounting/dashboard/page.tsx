'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Loader2, AlertCircle, RefreshCw, Download, ChevronUp, ChevronDown,
  Eye, EyeOff, FileText, ExternalLink, Filter, X, BarChart3,
} from 'lucide-react'

declare global { interface Window { Chart: any } }

// ── Types ──────────────────────────────────────────────────────────

interface Summary { fy: number; period: number; label: string; total_ba: number; total_obligations: number; total_outlays: number; obligation_rate: number; outlay_rate: number; ulo: number }
interface MultiYear { year: string; fy: number; budgetary_resources_b: number; obligations_b: number; outlays_b: number; obligation_rate: number; outlay_rate: number }
interface TasRow { code: string; name: string; fund_type: string; total_ba_b: number; obligations_b: number; outlays_b: number; obligation_rate: number; yoy_delta_b: number; yoy_pct: number }
interface CategoryRow { category: string; amount_b: number; transactions: number }
interface ComponentRow { agency?: string; name: string; full_name?: string; ba_b?: number; gtas_obl_m?: number; discrepancy_m?: number; obligations_b?: number; outlays_b?: number; award_count?: number }
interface AwardRow { recipient: string; sub_agency: string; award_type: string; naics: string; amount_m: number }
interface RawFile { filename: string; content: string; storage_url: string; pulled_at: string }

interface DashData {
  summary: Summary; multiYearChart: MultiYear[]
  tasChart: TasRow[]; categoryChart: CategoryRow[]
  componentChart: ComponentRow[]; topAwards: AwardRow[]
  rawFile: RawFile | null; availableFiles: Array<{ filename: string; created_at: string; storage_url: string }>
  pulled_at: string; filename?: string; source?: string
  availablePeriods?: Array<{ filename: string; label: string; pulled_at: string }>
  objectClassChart?: Array<{ code: string; name: string; amount_b: number }>
  programActivityChart?: Array<{ code: string; name: string; amount_b: number }>
  subAgencyChart?: Array<{ name: string; obligations_b: number; outlays_b: number }>
}

// ── Helpers ────────────────────────────────────────────────────────

const COLORS = ['#1E5AA8','#D4AF37','#D4883A','#C04B2D','#5B4BC4','#4C9C6F','#888780','#1D9E75','#E07B3A','#6B4BC4','#3B6D11','#A32D2D']
const FUND_COLORS: Record<string, string> = { '1-Year': '#1E5AA8', '2-Year': '#D4883A', 'No-Year': '#5B4BC4', 'Multi-Year': '#4C9C6F', 'Working Capital': '#D4AF37', 'Other': '#888780' }

const fmtB = (v: number | null) => v != null ? `$${v.toFixed(1)}B` : '—'
const fmtM = (v: number | null) => v != null ? `$${Math.abs(v).toLocaleString()}M` : '—'
const fmtPct = (v: number | null) => v != null ? `${v.toFixed(1)}%` : '—'
const isDark = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

function SortIcon({ col, sort }: { col: string; sort: { col: string; asc: boolean } }) {
  if (sort.col !== col) return <span className="text-muted-foreground/30 ml-1">↕</span>
  return sort.asc ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />
}

// ── Chart hook ─────────────────────────────────────────────────────

function useChart(id: string, config: any, deps: any[]) {
  const ref = useRef<any>(null)
  useEffect(() => {
    function build() {
      const canvas = document.getElementById(id) as HTMLCanvasElement
      if (!canvas || !(window as any).Chart) return
      if (ref.current) { ref.current.destroy(); ref.current = null }
      if (!config) return
      ref.current = new (window as any).Chart(canvas, config)
    }
    if ((window as any).Chart) { build(); return }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    s.onload = build
    document.head.appendChild(s)
    return () => { if (ref.current) { ref.current.destroy(); ref.current = null } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// ── Main ───────────────────────────────────────────────────────────

export default function ObligationDashboard() {
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFY, setSelectedFY] = useState<number | null>(null)
  const [fundFilter, setFundFilter] = useState<string>('All')
  const [componentFilter, setComponentFilter] = useState('')
  const [tasSort, setTasSort] = useState({ col: 'obligations_b', asc: false })
  const [awardSort, setAwardSort] = useState({ col: 'amount_m', asc: false })
  const [visibleCols, setVisibleCols] = useState({ ba: true, obligations: true, outlays: true, rate: true, yoy: true })
  const [showRaw, setShowRaw] = useState(false)
  const [rawTab, setRawTab] = useState<'preview' | 'full'>('preview')

  const dark = isDark()
  const gc = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const tc = dark ? '#9c9a92' : '#73726c'
  const scalBase = { grid: { color: gc }, ticks: { color: tc, font: { size: 11 } } }

  const load = useCallback(async (_fy?: number, period?: string) => {
    setLoading(true); setError(null)
    try {
      const url = `/api/obligation-dashboard${period ? `?period=${period}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || json.hint || 'API error')
      setData(json)
      if (!selectedFY && json.availablePeriods?.[0]) setSelectedFY(json.availablePeriods[0].label)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [selectedFY])

  useEffect(() => { load() }, [])

  const sortTable = <T extends Record<string, any>>(rows: T[], s: { col: string; asc: boolean }) =>
    [...rows].sort((a, b) => {
      const av = a[s.col] ?? -Infinity; const bv = b[s.col] ?? -Infinity
      return s.asc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })

  const fundTypes = data ? ['All', ...Array.from(new Set(data.tasChart.map(r => r.fund_type)))] : ['All']
  const filteredTAS = data ? sortTable(
    data.tasChart.filter(r => fundFilter === 'All' || r.fund_type === fundFilter),
    tasSort
  ) : []
  const filteredComponents = data ? (data.subAgencyChart ?? []).filter(r =>
    !componentFilter || r.name.toLowerCase().includes(componentFilter.toLowerCase())
  ) : []
  const sortedAwards = data ? sortTable(data.topAwards, awardSort) : []

  // Charts
  const multiYearConfig = data ? {
    type: 'bar',
    data: {
      labels: data.multiYearChart.map(d => d.year),
      datasets: [
        { label: 'Budget Authority ($B)', data: data.multiYearChart.map(d => d.budgetary_resources_b), backgroundColor: '#1E5AA8' },
        { label: 'Obligations ($B)', data: data.multiYearChart.map(d => d.obligations_b), backgroundColor: '#D4AF37' },
        { label: 'Outlays ($B)', data: data.multiYearChart.map(d => d.outlays_b), backgroundColor: '#4C9C6F' },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: tc, font: { size: 11 } } } }, scales: { x: scalBase, y: { ...scalBase, ticks: { ...scalBase.ticks, callback: (v: number) => `$${v}B` } } } },
  } : null

  const rateConfig = data ? {
    type: 'line',
    data: {
      labels: data.multiYearChart.map(d => d.year),
      datasets: [
        { label: 'Obligation rate %', data: data.multiYearChart.map(d => d.obligation_rate), borderColor: '#D4883A', backgroundColor: 'rgba(212,136,58,0.1)', fill: true, tension: 0.3 },
        { label: 'Outlay rate %', data: data.multiYearChart.map(d => d.outlay_rate), borderColor: '#4C9C6F', backgroundColor: 'rgba(76,156,111,0.1)', fill: true, tension: 0.3 },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: tc, font: { size: 11 } } } }, scales: { x: scalBase, y: { ...scalBase, min: 0, max: 110, ticks: { ...scalBase.ticks, callback: (v: number) => `${v}%` } } } },
  } : null

  const categoryConfig = data ? {
    type: 'doughnut',
    data: {
      labels: ((data.categoryChart ?? data.objectClassChart ?? []) as any[]).map(d => d.category),
      datasets: [{ data: ((data.categoryChart ?? data.objectClassChart ?? []) as any[]).map(d => d.amount_b), backgroundColor: COLORS }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' as const, labels: { color: tc, font: { size: 10 }, boxWidth: 10 } } } },
  } : null

  const fundTypeConfig = data ? {
    type: 'bar',
    data: {
      labels: filteredTAS.slice(0, 12).map(r => r.code.length > 18 ? r.code.slice(0, 18) + '…' : r.code),
      datasets: [
        { label: 'Budget Authority ($B)', data: filteredTAS.slice(0, 12).map(r => r.total_ba_b), backgroundColor: filteredTAS.slice(0, 12).map(r => FUND_COLORS[r.fund_type] + '80') },
        { label: 'Obligations ($B)', data: filteredTAS.slice(0, 12).map(r => r.obligations_b), backgroundColor: filteredTAS.slice(0, 12).map(r => FUND_COLORS[r.fund_type]) },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' as const, plugins: { legend: { labels: { color: tc, font: { size: 11 } } } }, scales: { x: { ...scalBase, stacked: false, ticks: { ...scalBase.ticks, callback: (v: number) => `$${v}B` } }, y: { grid: { display: false }, ticks: { color: tc, font: { size: 9 } } } } },
  } : null

  useChart('c-multiyear', multiYearConfig, [data, dark])
  useChart('c-rate', rateConfig, [data, dark])
  useChart('c-category', categoryConfig, [data, dark])
  useChart('c-tas', fundTypeConfig, [filteredTAS, dark])

  function exportCSV() {
    if (!data) return
    const rows = [
      ['Type', 'Label', 'Metric', 'Value', 'FY'],
      ...data.multiYearChart.map(d => ['Multi-Year', d.year, 'Budget Authority $B', String(d.budgetary_resources_b), String(d.fy)]),
      ...data.multiYearChart.map(d => ['Multi-Year', d.year, 'Obligations $B', String(d.obligations_b), String(d.fy)]),
      ...data.multiYearChart.map(d => ['Multi-Year', d.year, 'Outlays $B', String(d.outlays_b), String(d.fy)]),
      ...data.multiYearChart.map(d => ['Multi-Year', d.year, 'Obligation Rate %', String(d.obligation_rate), String(d.fy)]),
      ...data.tasChart.map(r => ['TAS', r.code, 'Obligations $B', String(r.obligations_b), String(data.summary.fy)]),
      ...data.tasChart.map(r => ['TAS', r.code, 'Fund Type', r.fund_type, String(data.summary.fy)]),
      ...((data.categoryChart ?? data.objectClassChart ?? []) as any[]).map(c => ['Category', c.category, 'Obligations $B', String(c.amount_b), String(data.summary.fy)]),
      ...data.topAwards.map(a => ['Award', a.recipient, 'Amount $M', String(a.amount_m), String(data.summary.fy)]),
    ]
    const csv = rows.map(r => r.map((c: string) => `"${c}"`).join(',')).join('\n')
    dl(`dod-obligations-FY${data.summary.fy}.csv`, csv, 'text/csv')
  }

  function dl(name: string, content: string, type: string) {
    const b = new Blob([content], { type })
    const url = URL.createObjectURL(b)
    const a = document.createElement('a')
    a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading USASpending data…</div>
  if (error) return <div className="p-8"><div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 max-w-xl"><div className="flex items-start gap-2"><AlertCircle className="h-4 w-4 text-destructive mt-0.5" /><div><p className="text-sm font-medium mb-1">Could not load data</p><p className="text-xs text-muted-foreground mb-2">{error}</p><button onClick={() => load()} className="text-xs text-gold">Retry →</button></div></div></div></div>
  if (!data) return null

  const { summary } = data

  return (
    <div className="p-5 max-w-7xl w-full">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold mb-1">Live · {summary.label}</p>
          <h1 className="text-xl font-medium tracking-tight">DoD Obligation Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">USASpending.gov · {new Date(data.pulled_at).toLocaleString()}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Period selector — populated from available DB periods */}
          {data.availablePeriods && data.availablePeriods.length > 1 && (
            <select
              value={selectedFY ?? ''}
              onChange={e => { setSelectedFY(e.target.value); load(undefined, e.target.value || undefined) }}
              className="text-xs border border-border rounded px-2 py-1.5 bg-background text-foreground"
            >
              {data.availablePeriods.map((p: any) => (
                <option key={p.filename} value={p.label}>{p.label}</option>
              ))}
            </select>
          )}
          <button onClick={() => load(selectedFY ?? undefined)} className="flex items-center gap-1 text-xs border border-border rounded px-2.5 py-1.5 text-muted-foreground hover:text-foreground transition">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1 text-xs border border-border rounded px-2.5 py-1.5 text-muted-foreground hover:text-gold transition">
            <Download className="h-3 w-3" /> CSV
          </button>
          <Link href={`/dashboard/chat?category=accounting&prompt=${encodeURIComponent(`Provide a comprehensive obligation analysis for FY${data.summary.fy} DoD spending: obligation rate, top funding categories, largest TAS accounts, top contractors, ULO concerns, and execution risks.`)}`}
            className="text-xs border border-primary/60 text-gold rounded px-2.5 py-1.5 hover:bg-accent transition">
            Ask agent →
          </Link>
        </div>
      </div>

      {/* ── Summary metrics ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-5">
        <Metric label="Budget Authority" value={fmtB(summary.total_ba ? summary.total_ba / 1e9 : null)} />
        <Metric label="Obligations" value={fmtB(summary.total_obligations ? summary.total_obligations / 1e9 : null)} />
        <Metric label="Outlays" value={fmtB(summary.total_outlays ? summary.total_outlays / 1e9 : null)} />
        <Metric label="Obligation Rate" value={fmtPct(summary.obligation_rate ? summary.obligation_rate * 100 : null)}
          tone={summary.obligation_rate ? (summary.obligation_rate < 0.55 ? 'warn' : 'ok') : undefined} />
        <Metric label="ULO (Obl − Outlays)" value={fmtB(summary.ulo ? summary.ulo / 1e9 : null)} />
      </div>

      {/* Execution reading */}
      {summary.obligation_rate != null && (
        <div className={`rounded-lg border p-3 mb-5 text-xs ${summary.obligation_rate < 0.55 ? 'border-gold/40 bg-gold/5' : 'border-green-600/40 bg-green-600/5'}`}>
          <span className="font-medium mr-2">{summary.obligation_rate < 0.55 ? '⚠ Execution risk' : '✓ On track'}</span>
          {summary.obligation_rate < 0.55
            ? `Obligation rate of ${fmtPct(summary.obligation_rate * 100)} at P${summary.period} indicates significant back-loading risk. Expect Q4 spike. Monitor ADA exposure on expiring 1-year funds.`
            : `Obligation rate of ${fmtPct(summary.obligation_rate * 100)} at P${summary.period} is on pace. ULO of ${fmtB(summary.ulo ? summary.ulo / 1e9 : null)} represents cash outlays not yet disbursed — normal for multi-year contracts.`}
        </div>
      )}

      {/* ── Charts row 1 ────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium mb-0.5">Multi-year BA / Obligations / Outlays ($B)</p>
          <p className="text-[11px] text-muted-foreground mb-3">4 fiscal years — budget authority vs obligated vs outlayed</p>
          <div style={{ height: 220 }}><canvas id="c-multiyear" /></div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium mb-0.5">Obligation & outlay rate trend (%)</p>
          <p className="text-[11px] text-muted-foreground mb-3">Obl/BA and Outlay/BA by fiscal year</p>
          <div style={{ height: 220 }}><canvas id="c-rate" /></div>
        </div>
      </div>

      {/* ── Charts row 2 ────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4 mb-5">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium mb-0.5">Obligations by award type</p>
          <p className="text-[11px] text-muted-foreground mb-3">Contracts vs grants vs direct payments vs IDVs</p>
          <div style={{ height: 220 }}><canvas id="c-category" /></div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium">TAS obligations by fund type</p>
            {/* Fund type filter */}
            <div className="flex gap-1 flex-wrap">
              {fundTypes.map(ft => (
                <button key={ft} onClick={() => setFundFilter(ft)}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition border ${fundFilter === ft ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                  {ft}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">1-Year / 2-Year / No-Year / WCF by TAS account</p>
          <div style={{ height: 220 }}><canvas id="c-tas" /></div>
        </div>
      </div>

      {/* ── TAS detail table ────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-wrap gap-2">
          <div>
            <p className="text-sm font-medium">Federal accounts (TAS) detail — FY{data.summary.fy}</p>
            <p className="text-[11px] text-muted-foreground">{filteredTAS.length} accounts · click headers to sort · filter by fund type above</p>
          </div>
          {/* Column visibility toggles */}
          <div className="flex gap-1 flex-wrap">
            {(['ba', 'obligations', 'outlays', 'rate', 'yoy'] as const).map(col => (
              <button key={col} onClick={() => setVisibleCols(v => ({ ...v, [col]: !v[col] }))}
                className={`text-[10px] px-2 py-0.5 rounded border transition flex items-center gap-1 ${visibleCols[col] ? 'border-border text-foreground' : 'border-border text-muted-foreground/40'}`}>
                {visibleCols[col] ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
                {col === 'ba' ? 'BA' : col === 'obligations' ? 'Obl' : col === 'outlays' ? 'Outlays' : col === 'rate' ? 'Rate' : 'YoY'}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <Th label="TAS Code" col="code" sort={tasSort} onSort={s => setTasSort(s)} />
                <Th label="Account Name" col="name" sort={tasSort} onSort={s => setTasSort(s)} />
                <Th label="Fund Type" col="fund_type" sort={tasSort} onSort={s => setTasSort(s)} />
                {visibleCols.ba         && <Th label="BA ($B)" col="total_ba_b" sort={tasSort} onSort={s => setTasSort(s)} right />}
                {visibleCols.obligations && <Th label="Obl ($B)" col="obligations_b" sort={tasSort} onSort={s => setTasSort(s)} right />}
                {visibleCols.outlays     && <Th label="Outlays ($B)" col="outlays_b" sort={tasSort} onSort={s => setTasSort(s)} right />}
                {visibleCols.rate        && <Th label="Rate %" col="obligation_rate" sort={tasSort} onSort={s => setTasSort(s)} right />}
                {visibleCols.yoy         && <Th label="YoY Δ" col="yoy_delta_b" sort={tasSort} onSort={s => setTasSort(s)} right />}
              </tr>
            </thead>
            <tbody>
              {filteredTAS.map((r, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-1.5 px-3 font-mono text-[11px]">{r.code}</td>
                  <td className="py-1.5 px-3 text-muted-foreground max-w-[220px] truncate" title={r.name}>{r.name}</td>
                  <td className="py-1.5 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: (FUND_COLORS[r.fund_type] ?? '#888') + '20', color: FUND_COLORS[r.fund_type] ?? '#888' }}>
                      {r.fund_type}
                    </span>
                  </td>
                  {visibleCols.ba          && <td className="py-1.5 px-3 text-right">{r.total_ba_b > 0 ? fmtB(r.total_ba_b) : '—'}</td>}
                  {visibleCols.obligations  && <td className="py-1.5 px-3 text-right font-medium">{r.obligations_b > 0 ? fmtB(r.obligations_b) : '—'}</td>}
                  {visibleCols.outlays      && <td className="py-1.5 px-3 text-right">{r.outlays_b > 0 ? fmtB(r.outlays_b) : '—'}</td>}
                  {visibleCols.rate         && <td className="py-1.5 px-3 text-right">
                    {r.obligation_rate != null ? (
                      <span className={r.obligation_rate < 40 ? 'text-gold' : r.obligation_rate > 90 ? 'text-green-600' : ''}>
                        {fmtPct(r.obligation_rate)}
                      </span>
                    ) : '—'}
                  </td>}
                  {visibleCols.yoy          && <td className={`py-1.5 px-3 text-right ${r.yoy_delta_b > 0 ? 'text-green-600' : r.yoy_delta_b < 0 ? 'text-destructive' : ''}`}>
                    {r.yoy_delta_b != null ? `${r.yoy_delta_b > 0 ? '+' : ''}${fmtB(r.yoy_delta_b)}` : '—'}
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DoD Component table ──────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-wrap gap-2">
          <p className="text-sm font-medium">DoD component breakdown</p>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={componentFilter} onChange={e => setComponentFilter(e.target.value)}
              placeholder="Filter by agency name…"
              className="text-xs border border-border rounded px-2 py-1 bg-background w-48" />
            {componentFilter && <button onClick={() => setComponentFilter('')}><X className="h-3 w-3 text-muted-foreground" /></button>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Component</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Budget Authority ($B)</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">GTAS Obligations ($M)</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Discrepancy ($M)</th>
              </tr>
            </thead>
            <tbody>
              {filteredComponents.map((r, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-1.5 px-3">
                    <div className="font-medium">{r.name}</div>
                  </td>
                  <td className="py-1.5 px-3 text-right">{r.obligations_b != null ? fmtB(r.obligations_b) : r.ba_b != null ? fmtB(r.ba_b) : '—'}</td>
                  <td className="py-1.5 px-3 text-right">{r.outlays_b != null ? fmtB(r.outlays_b) : r.gtas_obl_m != null ? fmtM(r.gtas_obl_m) : '—'}</td>
                  <td className="py-1.5 px-3 text-right">{r.award_count?.toLocaleString() ?? (r.discrepancy_m != null ? fmtM(r.discrepancy_m) : '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Top contractors table ────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-medium">Top DoD contractors — FY{data.summary.fy}</p>
          <p className="text-[11px] text-muted-foreground">{sortedAwards.length} awards · click headers to sort</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <Th label="Recipient" col="recipient" sort={awardSort} onSort={s => setAwardSort(s)} />
                <Th label="Sub-Agency" col="sub_agency" sort={awardSort} onSort={s => setAwardSort(s)} />
                <Th label="Type" col="award_type" sort={awardSort} onSort={s => setAwardSort(s)} />
                <Th label="Award ($M)" col="amount_m" sort={awardSort} onSort={s => setAwardSort(s)} right />
              </tr>
            </thead>
            <tbody>
              {sortedAwards.map((r, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-1.5 px-3 font-medium">{r.recipient}</td>
                  <td className="py-1.5 px-3 text-muted-foreground">{r.sub_agency}</td>
                  <td className="py-1.5 px-3 text-muted-foreground">{r.award_type}</td>
                  <td className="py-1.5 px-3 text-right font-medium">{fmtM(r.amount_m)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Raw ingested file ────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card">
        <button
          onClick={() => setShowRaw(r => !r)}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-border hover:bg-muted/20 transition"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gold" />
            <div className="text-left">
              <p className="text-sm font-medium">Raw ingested data file</p>
              <p className="text-[11px] text-muted-foreground">{data.rawFile?.filename ?? 'No file ingested yet'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data.rawFile?.storage_url?.startsWith('https://') && (
              <a href={data.rawFile.storage_url} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-gold border border-border rounded px-2 py-1 hover:bg-accent transition">
                <ExternalLink className="h-3 w-3" /> Download
              </a>
            )}
            {data.rawFile?.content && (
              <button onClick={e => { e.stopPropagation(); dl(data.rawFile!.filename, data.rawFile!.content, 'text/plain') }}
                className="flex items-center gap-1 text-xs border border-border rounded px-2 py-1 text-muted-foreground hover:text-gold transition">
                <Download className="h-3 w-3" /> Save
              </button>
            )}
            <BarChart3 className={`h-4 w-4 text-muted-foreground transition-transform ${showRaw ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {showRaw && data.rawFile && (
          <div className="p-4">
            {/* Available files list */}
            {data.availableFiles.length > 1 && (
              <div className="mb-3 flex gap-2 flex-wrap">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider self-center">History:</span>
                {data.availableFiles.map((f, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded border border-border bg-muted text-muted-foreground">
                    {f.filename.replace('usaspending_dod_obligations_', '').replace('.txt', '')}
                  </span>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-3 border-b border-border">
              {(['preview', 'full'] as const).map(t => (
                <button key={t} onClick={() => setRawTab(t)}
                  className={`text-xs px-3 py-1.5 border-b-2 transition ${rawTab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                  {t === 'preview' ? 'Preview (2000 chars)' : 'Full text'}
                </button>
              ))}
            </div>

            <pre className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap overflow-auto max-h-96 font-mono bg-muted/30 rounded p-3">
              {rawTab === 'preview'
                ? data.rawFile.content.slice(0, 2000) + (data.rawFile.content.length > 2000 ? '\n\n…[truncated]' : '')
                : data.rawFile.content}
            </pre>
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground mt-3">
        Source: USASpending.gov · DoD toptier code 097 · Data has ~90-day reporting lag per DATA Act requirements · All figures nominal dollars
      </p>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-medium tracking-tight ${tone === 'ok' ? 'text-green-600' : tone === 'warn' ? 'text-gold' : ''}`}>{value}</p>
    </div>
  )
}

function Th({ label, col, sort, onSort, right }: { label: string; col: string; sort: { col: string; asc: boolean }; onSort: (s: { col: string; asc: boolean }) => void; right?: boolean }) {
  return (
    <th
      onClick={() => onSort({ col, asc: sort.col === col ? !sort.asc : false })}
      className={`py-2 px-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition ${right ? 'text-right' : 'text-left'}`}
    >
      {label}<SortIcon col={col} sort={sort} />
    </th>
  )
}
