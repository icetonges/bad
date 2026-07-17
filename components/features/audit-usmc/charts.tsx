'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, PieChart, Pie,
} from 'recharts'
import {
  USMC_MATERIAL_WEAKNESSES, SCALE_COMPARISON, USMC_TOPLINE, MATERIALITY_BREAKDOWN,
} from './data'

const GOLD = '#D4AF37'
const BLUE = '#1E5AA8'
const ORANGE = '#D4883A'
const CORAL = '#C04B2D'
const PURPLE = '#5B4BC4'
const GREEN = '#4C9C6F'
const GRAY = '#888780'

const fmtB = (v: number) => `$${v.toFixed(v >= 100 ? 0 : 1)}B`

// ------------------------------------------------------------------
// 7 MATERIAL WEAKNESSES BY NATURE — pie chart
// ------------------------------------------------------------------
export function MWByNature() {
  const rollup = [
    { nature: 'Governance',          count: USMC_MATERIAL_WEAKNESSES.filter(m => m.nature === 'Governance').length,          color: PURPLE },
    { nature: 'Process/Manual',      count: USMC_MATERIAL_WEAKNESSES.filter(m => m.nature === 'Process/Manual').length,      color: ORANGE },
    { nature: 'IT General Controls', count: USMC_MATERIAL_WEAKNESSES.filter(m => m.nature === 'IT General Controls').length, color: BLUE },
  ]
  return (
    <div className="h-[300px] w-full relative">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={rollup}
            dataKey="count"
            nameKey="nature"
            cx="50%"
            cy="50%"
            innerRadius={64}
            outerRadius={110}
            paddingAngle={2}
          >
            {rollup.map((r, i) => (
              <Cell key={i} fill={r.color} stroke="hsl(var(--background))" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                  <div className="font-medium mb-0.5">{d.nature}</div>
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
              <span className="text-foreground">{v} <span className="text-muted-foreground">({rollup[i].count})</span></span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center" style={{ transform: 'translate(-70px, 0)' }}>
        <div className="text-xs text-muted-foreground">Total MWs</div>
        <div className="text-3xl font-medium tracking-tight">7</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">0 new · 0 resolved</div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// MW CARRY-FORWARD — beginning / new / resolved / ending
// ------------------------------------------------------------------
export function MWCarryForward() {
  const data = [
    { label: 'Beginning (FY24)', value: 7, tone: GRAY },
    { label: 'New in FY25',      value: 0, tone: CORAL },
    { label: 'Resolved in FY25', value: 0, tone: GREEN },
    { label: 'Ending (FY25)',    value: 7, tone: GRAY },
  ]
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} domain={[0, 8]} />
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                  <div className="font-medium">{d.label}</div>
                  <div className="text-muted-foreground">{d.value} material weakness{d.value !== 1 ? 'es' : ''}</div>
                </div>
              )
            }}
            cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.tone} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ------------------------------------------------------------------
// MATERIALITY BREAKDOWN — where the $52B in total assets sits
// ------------------------------------------------------------------
export function AssetMaterialityBar() {
  const colors = [GOLD, BLUE, GRAY]
  return (
    <div className="w-full">
      <div className="flex h-10 rounded-md overflow-hidden border border-border">
        {MATERIALITY_BREAKDOWN.map((m, i) => (
          <div
            key={i}
            style={{ width: `${m.pct}%`, background: colors[i % colors.length] }}
            className="flex items-center justify-center text-[11px] font-medium text-white"
            title={`${m.label}: ${fmtB(m.valueB)} (${m.pct}%)`}
          >
            {m.pct >= 8 ? `${m.pct}%` : ''}
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {MATERIALITY_BREAKDOWN.map((m, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px]">
            <span className="h-2.5 w-2.5 rounded-sm mt-0.5 flex-shrink-0" style={{ background: colors[i % colors.length] }} />
            <div>
              <span className="text-foreground font-medium">{m.label}</span>
              <span className="text-muted-foreground"> — {fmtB(m.valueB)} ({m.pct}%). {m.note}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// SCALE COMPARISON — USMC vs Army/Navy/Air Force asset base
// ------------------------------------------------------------------
export function ScaleComparison() {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer>
        <BarChart data={SCALE_COMPARISON} layout="vertical" margin={{ top: 8, right: 40, left: 130, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={fmtB} />
          <YAxis type="category" dataKey="entity" stroke="hsl(var(--muted-foreground))" fontSize={11} width={130} />
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg max-w-xs">
                  <div className="font-medium mb-1">{d.entity}</div>
                  <div className="text-muted-foreground mb-0.5">Total assets: <span className="text-foreground font-medium">{fmtB(d.totalAssetsB)}</span></div>
                  <div className="text-muted-foreground mb-0.5">Appropriations: <span className="text-foreground font-medium">{fmtB(d.appropriationsB)}</span></div>
                  <div className="text-muted-foreground">Opinion: <span className="text-foreground font-medium">{d.opinion}</span></div>
                </div>
              )
            }}
            cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
          />
          <Bar dataKey="totalAssetsB" radius={[0, 4, 4, 0]}>
            {SCALE_COMPARISON.map((d, i) => (
              <Cell key={i} fill={d.color === 'green' ? GREEN : CORAL} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 px-4">
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: GREEN }} /> Unmodified opinion</div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: CORAL }} /> Disclaimer</div>
        <div className="text-[10px]">Army/Navy/AF figures are order-of-magnitude estimates for scale contrast — see note below chart.</div>
      </div>
    </div>
  )
}
