'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, PieChart, Pie,
} from 'recharts'
import {
  THEMES, DOLLAR_AT_RISK, MATERIAL_WEAKNESSES, DISCLAIMED_ENTITIES, DATA_PIPELINES,
} from './data'

const GOLD = '#D4AF37'
const BLUE = '#1E5AA8'
const ORANGE = '#D4883A'
const CORAL = '#C04B2D'
const PURPLE = '#5B4BC4'
const GREEN = '#4C9C6F'
const GRAY = '#888780'

const fmtB = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}T` : `$${v.toFixed(1)}B`

function ThemedTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg max-w-xs">
      {label && <div className="font-medium mb-1">{label}</div>}
      {payload.map((e: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm" style={{ background: e.color }} />
          <span className="text-muted-foreground">{e.name}:</span>
          <span className="font-medium">{typeof e.value === 'number' ? fmtB(e.value) : e.value}</span>
        </div>
      ))}
    </div>
  )
}

// ------------------------------------------------------------------
// 26 MATERIAL WEAKNESSES BY THEME — pie chart
// ------------------------------------------------------------------
export function MaterialWeaknessesByTheme() {
  return (
    <div className="h-[360px] w-full relative">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={THEMES}
            dataKey="count"
            nameKey="theme"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={125}
            paddingAngle={2}
          >
            {THEMES.map((t, i) => (
              <Cell key={i} fill={t.color} stroke="hsl(var(--background))" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                  <div className="font-medium mb-0.5">{d.theme}</div>
                  <div className="text-muted-foreground">{d.count} material weakness{d.count > 1 ? 'es' : ''}</div>
                </div>
              )
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: 12, paddingLeft: 12 }}
            formatter={(v, _entry, i) => (
              <span className="text-foreground">{v} <span className="text-muted-foreground">({THEMES[i].count})</span></span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center" style={{ transform: 'translate(-90px, 0)' }}>
        <div className="text-xs text-muted-foreground">Total MWs</div>
        <div className="text-3xl font-medium tracking-tight">26</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">+ 2 SD, 5 noncomp.</div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// DOLLAR AT RISK — horizontal bar, log-scale feel via display
// ------------------------------------------------------------------
export function DollarAtRisk() {
  const data = DOLLAR_AT_RISK.map(d => ({
    ...d,
    displayAmount: d.amount,
  }))
  return (
    <div className="h-[520px] w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 32, left: 220, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={fmtB} scale="log" domain={[10, 5000]} />
          <YAxis type="category" dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10.5} width={220} />
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg max-w-xs">
                  <div className="font-medium mb-1">{d.label}</div>
                  <div className="text-muted-foreground mb-1">Exposure: <span className="text-foreground font-medium">{fmtB(d.amount)}</span></div>
                  <div className="text-muted-foreground">{d.context}</div>
                </div>
              )
            }}
            cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
          />
          <Bar dataKey="displayAmount" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.severity === 'high' ? CORAL : ORANGE} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 px-4">
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: CORAL }} /> High severity</div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: ORANGE }} /> Material (medium)</div>
        <div className="text-[10px]">X-axis log-scale for readability.</div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// DISCLAIMED ENTITIES — grouped bar by branch
// ------------------------------------------------------------------
export function DisclaimedEntitiesBreakdown() {
  const byBranch: Record<string, number> = {}
  for (const e of DISCLAIMED_ENTITIES) byBranch[e.branch] = (byBranch[e.branch] || 0) + 1
  byBranch['USMC (clean)'] = 1

  const data = Object.entries(byBranch).map(([branch, count]) => ({
    branch,
    count,
    clean: branch.includes('clean'),
  }))

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="branch" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                  <div className="font-medium">{d.branch}</div>
                  <div className="text-muted-foreground">{d.count} entity{d.count !== 1 ? 'ies' : ''} {d.clean ? 'clean' : 'disclaimed'}</div>
                </div>
              )
            }}
            cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.clean ? GREEN : CORAL} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ------------------------------------------------------------------
// ADVANA TOUCH COVERAGE — how many MWs are touched by Advana
// ------------------------------------------------------------------
export function AdvanaTouchCoverage() {
  const rollup = [
    { touch: 'Core',     count: MATERIAL_WEAKNESSES.filter(m => m.advanaTouch === 'Core').length,     color: BLUE  },
    { touch: 'Direct',   count: MATERIAL_WEAKNESSES.filter(m => m.advanaTouch === 'Direct').length,   color: GOLD  },
    { touch: 'Indirect', count: MATERIAL_WEAKNESSES.filter(m => m.advanaTouch === 'Indirect').length, color: GRAY  },
  ]
  const total = 26

  return (
    <div className="w-full">
      <div className="flex h-10 rounded-md overflow-hidden border border-border">
        {rollup.map((r, i) => {
          const pct = (r.count / total) * 100
          return (
            <div
              key={i}
              style={{ width: `${pct}%`, background: r.color }}
              className="flex items-center justify-center text-[11px] font-medium text-white"
              title={`${r.touch}: ${r.count} MWs`}
            >
              {r.count}
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-4">
          {rollup.map((r, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />
              <span>{r.touch} ({r.count})</span>
            </div>
          ))}
        </div>
        <div className="text-muted-foreground">
          Advana touches <span className="text-foreground font-medium">{rollup[0].count + rollup[1].count} of {total}</span> MWs directly
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// DATA PIPELINE PRIORITIES (from Feinberg memo)
// ------------------------------------------------------------------
export function DataPipelinePriorities() {
  const colorFor = (c: string) => c === 'Core' ? BLUE : c === 'High' ? GOLD : c === 'Supporting' ? GRAY : ORANGE
  return (
    <div className="grid gap-2">
      {DATA_PIPELINES.map((p) => (
        <div key={p.pipeline} className="rounded-md border border-border bg-card p-3 flex items-center gap-4">
          <div className="flex-shrink-0 w-20 text-sm font-medium">{p.pipeline}</div>
          <div className="flex-shrink-0 w-24">
            <span
              className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ background: colorFor(p.criticality) }}
            >
              {p.criticality}
            </span>
          </div>
          <div className="flex-1 min-w-0 text-xs text-muted-foreground truncate">{p.examples}</div>
        </div>
      ))}
    </div>
  )
}
