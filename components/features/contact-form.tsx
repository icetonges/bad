'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed')
      setStatus('success')
      setMessage('Message sent. We will respond within two business days.')
      form.reset()
    } catch (err) {
      setStatus('error')
      setMessage(String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Name</label>
          <Input name="name" required maxLength={120} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Email</label>
          <Input name="email" type="email" required />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Organization (optional)</label>
        <Input name="organization" maxLength={200} />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
        <Input name="subject" required maxLength={200} />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Message</label>
        <Textarea name="message" required maxLength={5000} rows={6} />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send message'}
        </Button>
        {status !== 'idle' && (
          <span className={status === 'success' ? 'text-xs text-green-600' : 'text-xs text-destructive'}>{message}</span>
        )}
      </div>
    </form>
  )
}
