'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileUpload } from '@/components/features/file-upload'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBytes, formatDate } from '@/lib/utils'
import {
  FileText, ArrowLeft, Trash2, RefreshCw, AlertCircle, CheckCircle2, Loader2,
} from 'lucide-react'

interface Doc {
  id: string
  filename: string
  size_bytes: number
  created_at: string
  chunk_count: number
  storage_url: string
}

interface LibraryPageProps {
  category: 'budget' | 'audit' | 'accounting' | 'contracts'
  categoryLabel: string
  backHref: string
  backLabel: string
  description: string
}

export function LibraryPage({ category, categoryLabel, backHref, backLabel, description }: LibraryPageProps) {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [embedding, setEmbedding] = useState<string | null>(null)
  const [embedResults, setEmbedResults] = useState<Record<string, string>>({})

  async function refresh() {
    try {
      const res = await fetch(`/api/upload?category=${category}`)
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Failed to load documents')
      else { setDocs(data.documents ?? []); setError(null) }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [category])

  async function handleDelete(id: string, filename: string) {
    if (!confirm(`Delete "${filename}"? This removes the document and all its embedded chunks from the knowledge base.`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      setDocs((prev) => prev.filter((d) => d.id !== id))
    } catch (e: any) {
      alert(`Delete failed: ${e?.message || String(e)}`)
    } finally {
      setDeleting(null)
    }
  }

  async function handleReEmbed(id: string) {
    setEmbedding(id)
    setEmbedResults((prev) => ({ ...prev, [id]: 'embedding…' }))
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Re-embed failed')
      setEmbedResults((prev) => ({ ...prev, [id]: `✓ ${data.chunk_count} chunks` }))
      // Update the doc's chunk count in state
      setDocs((prev) => prev.map((d) => d.id === id ? { ...d, chunk_count: data.chunk_count } : d))
    } catch (e: any) {
      setEmbedResults((prev) => ({ ...prev, [id]: `Error: ${e?.message}` }))
    } finally {
      setEmbedding(null)
    }
  }

  const missingChunks = docs.filter((d) => d.chunk_count === 0)

  return (
    <div className="p-8 max-w-5xl w-full">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition mb-4">
        <ArrowLeft className="h-3 w-3" /> Back to {backLabel}
      </Link>
      <header className="mb-6">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold mb-2">{categoryLabel}</p>
        <h1 className="text-2xl font-medium tracking-tight mb-1">Document library</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
      </header>

      {/* Warning banner for unembedded documents */}
      {missingChunks.length > 0 && (
        <div className="rounded-lg border border-gold/40 bg-gold/5 p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-gold mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-sm mb-1">
                {missingChunks.length} document{missingChunks.length > 1 ? 's' : ''} not yet searchable
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                These files were uploaded but not embedded — likely because <code className="bg-muted px-1 rounded">GOOGLE_API_KEY</code> wasn't set at upload time.
                Click <strong>Re-embed</strong> on each one, or make sure the key is set in Vercel and re-upload.
              </p>
              <button
                onClick={() => missingChunks.forEach((d) => d.storage_url.startsWith('https://') && handleReEmbed(d.id))}
                disabled={!!embedding}
                className="text-xs font-medium text-gold hover:text-primary transition inline-flex items-center gap-1.5"
              >
                <RefreshCw className="h-3 w-3" />
                Re-embed all {missingChunks.filter(d => d.storage_url.startsWith('https://')).length} at once
              </button>
            </div>
          </div>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload documents</CardTitle>
          <CardDescription>PDFs, XLSX, CSV, TXT. Files are chunked and embedded into pgvector — then the agent can search them.</CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload category={category} onComplete={refresh} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents {loading ? '' : `(${docs.length})`}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 mb-3 text-xs text-destructive">
              {error}
            </div>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents yet. Upload above to get started.</p>
          ) : (
            <ul className="divide-y divide-border">
              {docs.map((d) => {
                const isDeleting = deleting === d.id
                const isEmbedding = embedding === d.id
                const embedResult = embedResults[d.id]
                const noChunks = d.chunk_count === 0
                const canReEmbed = noChunks && d.storage_url.startsWith('https://')

                return (
                  <li key={d.id} className="py-3">
                    <div className="flex items-center gap-3">
                      <FileText className={`h-4 w-4 shrink-0 ${noChunks ? 'text-gold' : 'text-muted-foreground'}`} />
                      <span className="flex-1 text-sm truncate">{d.filename}</span>
                      <span className="text-xs text-muted-foreground">{formatBytes(d.size_bytes)}</span>
                      <span className="text-xs text-muted-foreground hidden md:block">{formatDate(d.created_at)}</span>

                      {/* Chunk count badge */}
                      {d.chunk_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-green-600">
                          <CheckCircle2 className="h-3 w-3" /> {d.chunk_count} chunks
                        </span>
                      ) : (
                        <span className="text-[10px] text-gold font-medium">not indexed</span>
                      )}

                      {/* Re-embed button */}
                      {canReEmbed && !embedResult && (
                        <button
                          onClick={() => handleReEmbed(d.id)}
                          disabled={!!embedding}
                          title="Re-embed this document into the knowledge base"
                          className="text-xs text-gold hover:text-primary transition inline-flex items-center gap-1 shrink-0"
                        >
                          {isEmbedding
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <RefreshCw className="h-3.5 w-3.5" />}
                          {isEmbedding ? 'embedding…' : 'Re-embed'}
                        </button>
                      )}

                      {/* Embed result */}
                      {embedResult && (
                        <span className={`text-[10px] ${embedResult.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>
                          {embedResult}
                        </span>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(d.id, d.filename)}
                        disabled={isDeleting || isEmbedding}
                        title="Delete document"
                        className="text-muted-foreground hover:text-destructive transition shrink-0"
                      >
                        {isDeleting
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {/* Re-embed note for browser-extracted files */}
                    {noChunks && !d.storage_url.startsWith('https://') && (
                      <p className="text-[10px] text-muted-foreground pl-7 mt-1">
                        Large file — delete and re-upload to re-index (browser-extracted files can't be re-embedded server-side).
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
