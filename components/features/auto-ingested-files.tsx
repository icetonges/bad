'use client'

import { useEffect, useState } from 'react'
import { Database, Download, RefreshCw, CheckCircle2, Loader2, ExternalLink, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface IngestedDoc {
  id: string
  filename: string
  size_bytes: number
  created_at: string
  chunk_count: number
  storage_url: string
  metadata: Record<string, any>
}

export function AutoIngestedFiles() {
  const [docs, setDocs] = useState<IngestedDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [embedding, setEmbedding] = useState<string | null>(null)
  const [embedResults, setEmbedResults] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/upload?category=accounting')
      .then(r => r.json())
      .then(d => {
        // Filter to auto-ingested only
        const auto = (d.documents ?? []).filter((doc: any) =>
          doc.filename?.startsWith('usaspending_') ||
          doc.filename?.includes('dod_obligations') ||
          doc.filename?.includes('file_b')
        )
        setDocs(auto)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function reEmbed(id: string) {
    setEmbedding(id)
    setEmbedResults(p => ({ ...p, [id]: 'embedding…' }))
    try {
      const r = await fetch(`/api/documents/${id}`, { method: 'POST' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setEmbedResults(p => ({ ...p, [id]: `✓ ${d.chunk_count} chunks` }))
      setDocs(prev => prev.map(doc => doc.id === id ? { ...doc, chunk_count: d.chunk_count } : doc))
    } catch (e: any) {
      setEmbedResults(p => ({ ...p, [id]: `Error: ${e.message}` }))
    } finally {
      setEmbedding(null)
    }
  }

  if (!loading && docs.length === 0) return null

  return (
    <div className="px-8 pt-8 max-w-5xl w-full">
      <div className="rounded-lg border border-border bg-card mb-6">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <Database className="h-4 w-4 text-gold" />
          <div>
            <p className="text-sm font-medium">Auto-ingested data — USASpending.gov</p>
            <p className="text-[11px] text-muted-foreground">Pulled weekly by GitHub Actions · Automatically embedded for agent search</p>
          </div>
        </div>

        {loading ? (
          <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {docs.map(doc => {
              const result = embedResults[doc.id]
              const isEmbedding = embedding === doc.id
              const noChunks = (doc.chunk_count ?? 0) === 0
              const periodMatch = doc.filename.match(/FY(\d{4})_P(\d{2})/)
              const period = periodMatch ? `FY${periodMatch[1]} P${periodMatch[2]}` : ''

              return (
                <li key={doc.id} className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Database className={`h-4 w-4 shrink-0 ${noChunks ? 'text-gold' : 'text-green-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{doc.filename}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {period} · {Math.round(doc.size_bytes / 1024)}KB · {formatDate(doc.created_at)}
                      </p>
                    </div>

                    {/* Chunk status */}
                    {result ? (
                      <span className={`text-[11px] ${result.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>{result}</span>
                    ) : noChunks ? (
                      <span className="text-[10px] text-gold font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> not indexed
                      </span>
                    ) : (
                      <span className="text-[11px] text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {doc.chunk_count} chunks
                      </span>
                    )}

                    {/* Re-embed */}
                    {noChunks && !result && (
                      <button
                        onClick={() => reEmbed(doc.id)}
                        disabled={!!embedding}
                        className="text-xs text-gold hover:text-primary transition flex items-center gap-1 shrink-0"
                      >
                        {isEmbedding ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        {isEmbedding ? 'embedding…' : 'Re-embed'}
                      </button>
                    )}

                    {/* Download */}
                    {doc.storage_url?.startsWith('https://') && (
                      <a
                        href={doc.storage_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs border border-border rounded px-2 py-1 text-muted-foreground hover:text-gold transition flex items-center gap-1 shrink-0"
                      >
                        <ExternalLink className="h-3 w-3" /> Open
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <div className="px-5 py-2 border-t border-border flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            Runs every Sunday via GitHub Actions · <a href="https://github.com/icetonges/bad/actions" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">View logs</a>
          </p>
          <a
            href="https://github.com/icetonges/bad/actions/workflows/dod-obligations.yml"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-gold hover:text-primary transition flex items-center gap-1"
          >
            <RefreshCw className="h-2.5 w-2.5" /> Trigger manual run
          </a>
        </div>
      </div>
    </div>
  )
}
