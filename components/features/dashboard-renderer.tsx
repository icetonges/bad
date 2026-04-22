'use client'

import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface ChartSpec {
  chart_type: 'bar' | 'horizontal_bar' | 'stacked_bar' | 'line' | 'area' | 'pie' | 'scatter'
  title: string
  subtitle?: string
  data: Array<Record<string, any>>
  x_key: string
  y_keys?: string[]
  format?: 'currency_b' | 'currency_m' | 'currency_k' | 'percentage' | 'count'
}

const COLORS = ['#185FA5', '#D85A30', '#1D9E75', '#BA7517', '#534AB7', '#993556', '#888780']

function formatValue(v: number, format?: string): string {
  if (v == null || isNaN(v)) return '—'
  switch (format) {
    case 'currency_b': return `$${v.toFixed(1)}B`
    case 'currency_m': return `$${v.toFixed(1)}M`
    case 'currency_k': return `$${v.toFixed(0)}K`
    case 'percentage': return `${v.toFixed(1)}%`
    case 'count': return v.toLocaleString()
    default: return String(v)
  }
}

export function DashboardRenderer({ spec }: { spec: ChartSpec }) {
  const yKeys = spec.y_keys ?? Object.keys(spec.data[0] ?? {}).filter((k) => k !== spec.x_key)
  const fmt = (v: number) => formatValue(v, spec.format)

  return (
    <div className="rounded-lg border border-border bg-card p-5 my-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium tracking-tight">{spec.title}</h3>
        {spec.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{spec.subtitle}</p>}
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(spec, yKeys, fmt)}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function renderChart(spec: ChartSpec, yKeys: string[], fmt: (v: number) => string): any {
  const common = { data: spec.data, margin: { top: 10, right: 20, left: 10, bottom: 40 } }

  switch (spec.chart_type) {
    case 'horizontal_bar':
      return (
        <BarChart {...common} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis type="number" tickFormatter={fmt} fontSize={11} />
          <YAxis type="category" dataKey={spec.x_key} fontSize={11} width={140} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          {yKeys.map((k, i) => (
            <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} />
          ))}
        </BarChart>
      )
    case 'stacked_bar':
      return (
        <BarChart {...common}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey={spec.x_key} fontSize={11} angle={-30} textAnchor="end" />
          <YAxis tickFormatter={fmt} fontSize={11} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          {yKeys.map((k, i) => (
            <Bar key={k} dataKey={k} stackId="a" fill={COLORS[i % COLORS.length]} />
          ))}
        </BarChart>
      )
    case 'line':
      return (
        <LineChart {...common}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey={spec.x_key} fontSize={11} />
          <YAxis tickFormatter={fmt} fontSize={11} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          {yKeys.map((k, i) => (
            <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      )
    case 'area':
      return (
        <AreaChart {...common}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey={spec.x_key} fontSize={11} />
          <YAxis tickFormatter={fmt} fontSize={11} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          {yKeys.map((k, i) => (
            <Area key={k} type="monotone" dataKey={k} stackId="1" stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.6} />
          ))}
        </AreaChart>
      )
    case 'pie':
      return (
        <PieChart>
          <Pie data={spec.data} dataKey={yKeys[0]} nameKey={spec.x_key} cx="50%" cy="50%" outerRadius={110} label>
            {spec.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => fmt(v)} />
        </PieChart>
      )
    case 'scatter':
      return (
        <ScatterChart {...common}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis type="number" dataKey={spec.x_key} fontSize={11} />
          <YAxis type="number" dataKey={yKeys[0]} fontSize={11} tickFormatter={fmt} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Scatter data={spec.data} fill={COLORS[0]} />
        </ScatterChart>
      )
    default:
      return (
        <BarChart {...common}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey={spec.x_key} fontSize={11} angle={-30} textAnchor="end" />
          <YAxis tickFormatter={fmt} fontSize={11} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          {yKeys.map((k, i) => (
            <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} />
          ))}
        </BarChart>
      )
  }
}
