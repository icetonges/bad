'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, Check, X } from 'lucide-react'
import { formatBytes } from '@/lib/utils'

// Files above this threshold are text-extracted in the browser,
// avoiding Vercel's 4.5 MB serverless function body limit.
const LARGE_FILE_THRESHOLD = 4 * 1024 * 1024 // 4 MB

type UploadState = 'idle' | 'extracting' | 'uploading' | 'done' | 'error'
interface Item { file: File; state: UploadState; message?: string; chunks?: number }

// ------------------------------------------------------------------
// Client-side text extraction by file type
// ------------------------------------------------------------------
async function extractText(file: File): Promise<string> {
  const lower = file.name.toLowerCase()
  const buffer = await file.arrayBuffer()

  // XLSX / XLS — SheetJS works natively in the browser
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const XLSX = (await import('xlsx')).default
    const wb = XLSX.read(buffer, { type: 'array' })
    return wb.SheetNames.map(
      (name) => `## Sheet: ${name}\n` + XLSX.utils.sheet_to_csv(wb.Sheets[name])
    ).join('\n\n')
  }

  // PDF — pdfjs-dist, lazy-loaded only when needed
  if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
    // Use CDN for the worker to avoid webpack/Next.js bundling complexities
    GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs'
    const pdf = await getDocument({ data: buffer }).promise
    let text = ''
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p)
      const content = await page.getTextContent()
      text += content.items.map((item: any) => item.str ?? '').join(' ') + '\n'
    }
    return text
  }

  // CSV / TXT
  return new TextDecoder().decode(buffer)
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export function FileUpload({ category, onComplete }: { category: string; onComplete?: () => void }) {
  const [items, setItems] = useState<Item[]>([])

  const update = (file: File, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.file === file ? { ...it, ...patch } : it)))

  const handleFile = useCallback(
    async (file: File) => {
      try {
        if (file.size > LARGE_FILE_THRESHOLD) {
          // ---- Large file: extract text client-side, send text to server ----
          update(file, { state: 'extracting' })
          const text = await extractText(file)

          update(file, { state: 'uploading' })
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              filename: file.name,
              mimeType: file.type,
              size: file.size,
              category,
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Processing failed')
          update(file, { state: 'done', chunks: data.chunk_count })
        } else {
          // ---- Small file: standard multipart POST (server handles everything) ----
          update(file, { state: 'uploading' })
          const form = new FormData()
          form.append('file', file)
          form.append('category', category)
          const res = await fetch('/api/upload', { method: 'POST', body: form })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Upload failed')
          update(file, { state: 'done', chunks: data.chunk_count })
        }
        onComplete?.()
      } catch (e: any) {
        update(file, { state: 'error', message: e?.message || String(e) })
      }
    },
    [category, onComplete]
  )

  const onDrop = useCallback(
    (accepted: File[]) => {
      const additions: Item[] = accepted.map((f) => ({ file: f, state: 'idle' }))
      setItems((prev) => [...prev, ...additions])
      additions.forEach((it) => handleFile(it.file))
    },
    [handleFile]
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
    maxSize: 200 * 1024 * 1024, // 200 MB limit (browser-side extraction handles large files)
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
        <p className="text-sm">
          {isDragActive ? 'Drop files here' : 'Drag and drop PDF, XLSX, CSV, or TXT — or click to select'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Up to 200 MB · Large files are processed in the browser · Category: {category}
        </p>
      </div>

      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="rounded-md border border-border p-2.5 text-sm">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{it.file.name}</span>
                <span className="text-xs text-muted-foreground">{formatBytes(it.file.size)}</span>

                {it.state === 'extracting' && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    reading…
                  </span>
                )}
                {it.state === 'uploading' && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    embedding…
                  </span>
                )}
                {it.state === 'done' && (
                  <>
                    <span className="text-xs text-muted-foreground">{it.chunks} chunks</span>
                    <Check className="h-4 w-4 text-green-600" />
                  </>
                )}
                {it.state === 'error' && <X className="h-4 w-4 text-destructive" />}
              </div>

              {it.state === 'error' && it.message && (
                <div className="mt-2 pl-7 text-xs text-destructive break-words">{it.message}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
