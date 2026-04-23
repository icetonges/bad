'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'

interface HealthResponse {
  ok: boolean
  env: { missing: string[] }
  db: { connected: boolean; error?: string; tables?: Record<string, boolean>; extensions?: Record<string, boolean> }
  next_steps: string[]
}

export function HealthBanner() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mb-6 rounded-lg border border-border bg-card p-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking configuration…
      </div>
    )
  }

  if (!health) return null
  if (health.ok) return null  // All good — don't show
  if (dismissed) return null

  return (
    <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm mb-2">Configuration issues detected</div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            The app is deployed but some features will not work until the following are resolved:
          </p>
          <ul className="space-y-1.5 mb-3">
            {health.next_steps.map((step, i) => (
              <li key={i} className="text-xs leading-relaxed flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {health.env.missing.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-0.5 text-muted-foreground">
                Missing env: {health.env.missing.join(', ')}
              </span>
            )}
            {health.db.connected ? (
              <span className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-0.5 text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-green-600" /> DB connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-0.5 text-muted-foreground">
                DB not connected
              </span>
            )}
            {health.db.tables && Object.entries(health.db.tables).some(([, v]) => !v) && (
              <span className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-0.5 text-muted-foreground">
                Missing tables: {Object.entries(health.db.tables).filter(([, v]) => !v).map(([k]) => k).join(', ')}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-muted-foreground hover:text-foreground rounded"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
