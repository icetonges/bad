'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileUpload } from '@/components/features/file-upload'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBytes, formatDate } from '@/lib/utils'
import { FileText, ArrowLeft } from 'lucide-react'

interface Doc {
  id: string
  filename: string
  size_bytes: number
  created_at: string
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

  async function refresh() {
    try {
      const res = await fetch(`/api/upload?category=${category}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load documents')
      } else if (data.documents) {
        setDocs(data.documents)
        setError(null)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [category])

  return (
    <div className="p-8 max-w-5xl w-full">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition mb-4">
        <ArrowLeft className="h-3 w-3" /> Back to {backLabel}
      </Link>
      <header className="mb-8">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold mb-2">{categoryLabel}</p>
        <h1 className="text-2xl font-medium tracking-tight mb-1">Document library</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
      </header>

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
              {docs.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-2.5">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-sm truncate">{d.filename}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(d.size_bytes)}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(d.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
