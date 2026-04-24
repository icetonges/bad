'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, Check, X } from 'lucide-react'
import { upload } from '@vercel/blob/client'
import { formatBytes } from '@/lib/utils'

// Files larger than this go directly from browser to Vercel Blob,
// bypassing the 4.5MB serverless function body limit.
const LARGE_FILE_THRESHOLD = 4 * 1024 * 1024 // 4 MB

type UploadState = 'idle' | 'uploading' | 'processing' | 'done' | 'error'
interface Item { file: File; state: UploadState; message?: string; chunks?: number; progress?: number }

export function FileUpload({ category, onComplete }: { category: string; onComplete?: () => void }) {
  const [items, setItems] = useState<Item[]>([])

  const update = (file: File, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.file === file ? { ...it, ...patch } : it)))

  const handleFile = useCallback(
    async (file: File) => {
      try {
        let blobUrl: string

        if (file.size > LARGE_FILE_THRESHOLD) {
          // ---- Large file: browser → Vercel Blob directly ----
          // The file never goes through a serverless function body.
          // /api/upload/token handles auth/validation server-side.
          const blob = await upload(
            `${category}/${Date.now()}-${file.name}`,
            file,
            {
              access: 'public',
              handleUploadUrl: '/api/upload/token',
              multipart: true, // parallel chunk uploads for large files
              onUploadProgress: ({ percentage }) => {
                update(file, { progress: Math.round(percentage) })
              },
            }
          )
          blobUrl = blob.url

          // Switch status to processing (text extraction still happens server-side)
          update(file, { state: 'processing', progress: undefined })

          // Now tell the server to extract text and embed
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              blobUrl,
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
          // ---- Small file: traditional multipart POST ----
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
      const additions: Item[] = accepted.map((f) => ({ file: f, state: 'uploading' }))
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
    maxSize: 50 * 1024 * 1024, // 50 MB (handled by Vercel Blob for large files)
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
        <p className="text-xs text-muted-foreground mt-1">Up to 50 MB · Category: {category}</p>
      </div>

      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="rounded-md border border-border p-2.5 text-sm">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{it.file.name}</span>
                <span className="text-xs text-muted-foreground">{formatBytes(it.file.size)}</span>

                {it.state === 'uploading' && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {it.progress !== undefined ? `${it.progress}%` : 'uploading…'}
                  </span>
                )}
                {it.state === 'processing' && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    processing…
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

              {/* Progress bar for large files uploading */}
              {it.state === 'uploading' && it.progress !== undefined && (
                <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${it.progress}%` }}
                  />
                </div>
              )}

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
