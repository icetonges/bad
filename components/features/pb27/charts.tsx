'use client'

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell, PieChart, Pie,
} from 'recharts'
import {
  MANDATORY_BY_SECTION, PROCUREMENT_BY_APPROP, MAC_MUNITIONS,
  AI_AUTONOMY_BREAKDOWN, DISCRETIONARY_BY_TITLE, LOE,
} from './data'

// Colors chosen to read well on both light and dark backgrounds
const GOLD = '#D4AF37'
const BLUE = '#1E5AA8'
const ORANGE = '#D4883A'
const CORAL = '#C04B2D'
const PURPLE = '#5B4BC4'
const GRAY = '#888780'

const fmtB = (v: number) => `$${v.toFixed(1)}B`
const fmtBTight = (v: number) => `$${Number(v).toFixed(1)}B`

// Custom tooltip that reads the app's CSS vars so it looks right in both modes
function ThemedTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      {label && <div className="font-medium mb-1">{label}</div>}
      {payload.map((e: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm" style={{ background: e.color }} />
          <span className="text-muted-foreground">{e.name}:</span>
          <span className="font-medium">{fmtBTight(e.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ------------------------------------------------------------------
// MANDATORY BY SECTION — horizontal bar
// ------------------------------------------------------------------
export function MandatoryBySection() {
  return (
    <div className="h-[420px] w-full">
      <ResponsiveContainer>
        <BarChart data={MANDATORY_BY_SECTION} layout="vertical" margin={{ top: 8, right: 32, left: 140, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={fmtBTight} />
          <YAxis type="category" dataKey="section" stroke="hsl(var(--muted-foreground))" fontSize={11} width={140} />
          <Tooltip content={<ThemedTooltip />} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }} />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
            {MANDATORY_BY_SECTION.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ------------------------------------------------------------------
// DISCRETIONARY BY TITLE — donut with a center label
// ------------------------------------------------------------------
export function DiscretionaryByTitle() {
  const totalDisc = DISCRETIONARY_BY_TITLE.reduce((s, d) => s + d.amount, 0)
  const colors = [BLUE, GOLD, ORANGE, CORAL, PURPLE, GRAY, '#4C9C6F']
  return (
    <div className="h-[360px] w-full relative">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={DISCRETIONARY_BY_TITLE}
            dataKey="amount"
            nameKey="title"
            cx="50%"
            cy="50%"
            innerRadius={75}
            outerRadius={130}
            paddingAngle={2}
          >
            {DISCRETIONARY_BY_TITLE.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} stroke="hsl(var(--background))" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<ThemedTooltip />} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: 12, paddingLeft: 12 }}
            formatter={(v, _entry, i) => {
              const d = DISCRETIONARY_BY_TITLE[i]
              return <span className="text-foreground">{v} <span className="text-muted-foreground">${d.amount}B</span></span>
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center" style={{ transform: 'translate(-110px, 0)' }}>
        <div className="text-xs text-muted-foreground">Total discretionary</div>
        <div className="text-2xl font-medium tracking-tight">${totalDisc.toFixed(0)}B</div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// PROCUREMENT BY APPROPRIATION — stacked horizontal bar
// ------------------------------------------------------------------
export function ProcurementByAppropriation() {
  return (
    <div className="h-[640px] w-full">
      <ResponsiveContainer>
        <BarChart data={PROCUREMENT_BY_APPROP} layout="vertical" margin={{ top: 8, right: 32, left: 190, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={fmtBTight} />
          <YAxis type="category" dataKey="appropriation" stroke="hsl(var(--muted-foreground))" fontSize={10.5} width={190} />
          <Tooltip content={<ThemedTooltip />} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="disc" name="Discretionary" stackId="s" fill={BLUE} radius={[0, 0, 0, 0]} />
          <Bar dataKey="mand" name="Mandatory" stackId="s" fill={ORANGE} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ------------------------------------------------------------------
// MAC MUNITIONS — horizontal bar, top program highlighted
// ------------------------------------------------------------------
export function MacMunitions() {
  return (
    <div className="h-[620px] w-full">
      <ResponsiveContainer>
        <BarChart data={MAC_MUNITIONS} layout="vertical" margin={{ top: 8, right: 32, left: 190, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={fmtBTight} />
          <YAxis type="category" dataKey="program" stroke="hsl(var(--muted-foreground))" fontSize={10.5} width={190} />
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                  <div className="font-medium mb-1">{d.program}</div>
                  <div className="text-muted-foreground">Amount: <span className="text-foreground font-medium">{fmtBTight(d.amount)}</span></div>
                  {d.qty !== '—' && <div className="text-muted-foreground">Quantity: <span className="text-foreground font-medium">{d.qty}</span></div>}
                </div>
              )
            }}
            cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
          />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
            {MAC_MUNITIONS.map((d, i) => <Cell key={i} fill={d.emphasis ? CORAL : ORANGE} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ------------------------------------------------------------------
// AI / AUTONOMY — horizontal bar by category
// ------------------------------------------------------------------
export function AiAutonomyBreakdown() {
  return (
    <div className="h-[440px] w-full">
      <ResponsiveContainer>
        <BarChart data={AI_AUTONOMY_BREAKDOWN} layout="vertical" margin={{ top: 8, right: 32, left: 180, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={fmtBTight} />
          <YAxis type="category" dataKey="item" stroke="hsl(var(--muted-foreground))" fontSize={11} width={180} />
          <Tooltip content={<ThemedTooltip />} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }} />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
            {AI_AUTONOMY_BREAKDOWN.map((d, i) => (
              <Cell key={i} fill={d.category === 'AI' ? BLUE : ORANGE} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 px-4">
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: BLUE }} /> AI Arsenal</div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: ORANGE }} /> Drone Dominance</div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// LINES OF EFFORT — simple bar
// ------------------------------------------------------------------
export function LinesOfEffort() {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer>
        <BarChart data={LOE} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="short" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `$${v}B`} />
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg max-w-xs">
                  <div className="font-medium mb-1">{d.label}</div>
                  <div className="mb-1">${d.amount}B</div>
                  <div className="text-muted-foreground">{d.note}</div>
                </div>
              )
            }}
            cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {LOE.map((_, i) => <Cell key={i} fill={[BLUE, CORAL, GOLD, PURPLE][i % 4]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
