'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, Check, X } from 'lucide-react'
import { formatBytes } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type UploadState = 'idle' | 'uploading' | 'done' | 'error'
interface Item { file: File; state: UploadState; message?: string; chunks?: number }

export function FileUpload({ category, onComplete }: { category: string; onComplete?: () => void }) {
  const [items, setItems] = useState<Item[]>([])

  const upload = useCallback(
    async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      form.append('category', category)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload failed')
        setItems((prev) => prev.map((it) => (it.file === file ? { ...it, state: 'done', chunks: data.chunk_count } : it)))
        onComplete?.()
      } catch (e) {
        setItems((prev) => prev.map((it) => (it.file === file ? { ...it, state: 'error', message: String(e) } : it)))
      }
    },
    [category, onComplete]
  )

  const onDrop = useCallback(
    (accepted: File[]) => {
      const additions: Item[] = accepted.map((f) => ({ file: f, state: 'uploading' }))
      setItems((prev) => [...prev, ...additions])
      additions.forEach((it) => upload(it.file))
    },
    [upload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt', '.md'],
    },
    maxSize: 20 * 1024 * 1024,
  })

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`rounded-lg border-2 border-dashed transition p-8 text-center cursor-pointer ${
          isDragActive ? 'border-primary bg-accent' : 'border-border hover:bg-accent/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm">{isDragActive ? 'Drop files here' : 'Drag and drop PDF, XLSX, CSV, or TXT — or click to select'}</p>
        <p className="text-xs text-muted-foreground mt-1">Max 20 MB per file · Category: {category}</p>
      </div>
      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="rounded-md border border-border p-2.5 text-sm">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{it.file.name}</span>
                <span className="text-xs text-muted-foreground">{formatBytes(it.file.size)}</span>
                {it.state === 'uploading' && <Loader2 className="h-4 w-4 animate-spin" />}
                {it.state === 'done' && (
                  <>
                    <span className="text-xs text-muted-foreground">{it.chunks} chunks</span>
                    <Check className="h-4 w-4 text-green-600" />
                  </>
                )}
                {it.state === 'error' && <X className="h-4 w-4 text-destructive" />}
              </div>
              {it.state === 'error' && it.message && (
                <div className="mt-2 pl-7 text-xs text-destructive break-words">
                  {it.message}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
