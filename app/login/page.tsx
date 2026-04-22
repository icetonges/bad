'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/db/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function handle() {
    setBusy(true)
    setMessage('')
    const supabase = createBrowserSupabase()
    try {
      const fn = mode === 'signin' ? supabase.auth.signInWithPassword : supabase.auth.signUp
      const { data, error } = await fn({ email, password })
      if (error) throw error
      if (mode === 'signup' && !data.session) {
        setMessage('Check your email to confirm the account.')
      } else {
        router.push('/dashboard')
      }
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{mode === 'signin' ? 'Sign in' : 'Create account'}</CardTitle>
          <CardDescription>Use your email and password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button onClick={handle} disabled={busy} className="w-full">
            {busy ? '...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </Button>
          <button
            onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
            className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
          >
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
          {message && <p className="text-xs text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
