'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Report {
  id: string
  title: string
  category: string
  content: string
  created_at: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [selected, setSelected] = useState<Report | null>(null)

  useEffect(() => {
    fetch('/api/reports').then((r) => r.json()).then((d) => setReports(d.reports || []))
  }, [])

  return (
    <div className="flex h-screen">
      <div className="w-80 border-r border-border overflow-y-auto">
        <div className="h-14 border-b border-border flex items-center px-5">
          <h1 className="text-sm font-medium">Reports</h1>
        </div>
        <ul className="divide-y divide-border">
          {reports.length === 0 && <li className="p-5 text-sm text-muted-foreground">No reports yet.</li>}
          {reports.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => setSelected(r)}
                className={`w-full text-left p-4 hover:bg-accent transition ${selected?.id === r.id ? 'bg-accent' : ''}`}
              >
                <div className="flex items-start gap-2.5">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.category} · {formatDate(r.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <article className="max-w-3xl mx-auto p-8 prose-fed">
            <h1 className="text-2xl font-medium tracking-tight mb-1">{selected.title}</h1>
            <p className="text-xs text-muted-foreground mb-6">
              {selected.category} · {formatDate(selected.created_at)}
            </p>
            <div className="text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.content}</ReactMarkdown>
            </div>
          </article>
        ) : (
          <div className="p-8 text-sm text-muted-foreground">Select a report to view.</div>
        )}
      </div>
    </div>
  )
}
