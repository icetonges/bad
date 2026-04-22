'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileUpload } from '@/components/features/file-upload'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatBytes, formatDate } from '@/lib/utils'
import { FileText, MessageSquare, Sparkles } from 'lucide-react'

interface Doc {
  id: string
  filename: string
  size_bytes: number
  created_at: string
}

export function CategoryPage({
  category,
  title,
  subtitle,
  quickActions,
}: {
  category: string
  title: string
  subtitle: string
  quickActions: Array<{ label: string; prompt: string }>
}) {
  const [docs, setDocs] = useState<Doc[]>([])

  async function refresh() {
    try {
      const res = await fetch(`/api/upload?category=${category}`)
      const data = await res.json()
      if (data.documents) setDocs(data.documents)
    } catch {}
  }
  useEffect(() => { refresh() }, [category])

  return (
    <div className="p-8 max-w-6xl w-full">
      <header className="mb-8">
        <p className="text-xs tracking-wider uppercase text-muted-foreground mb-1">Category</p>
        <h1 className="text-2xl font-medium tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload documents</CardTitle>
              <CardDescription>Files are chunked, embedded, and made available to the agent.</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload category={category} onComplete={refresh} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents ({docs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {docs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents yet.</p>
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

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Quick actions
              </CardTitle>
              <CardDescription>Trigger the agent with a pre-built prompt.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {quickActions.map((q) => (
                <Link
                  key={q.label}
                  href={`/dashboard/chat?category=${category}&prompt=${encodeURIComponent(q.prompt)}`}
                  className="block rounded-md border border-border p-2.5 text-sm hover:bg-accent transition"
                >
                  {q.label}
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ask the agent</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/dashboard/chat?category=${category}`}>
                <Button variant="outline" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" /> Open chat
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
