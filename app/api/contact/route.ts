import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

export const runtime = 'nodejs'

const Schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  organization: z.string().max(200).optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid input', issues: parsed.error.issues }, { status: 400 })
  }
  const { name, email, organization, subject, message } = parsed.data

  const html = `
    <h2>fedAnalyst contact form</h2>
    <p><b>From:</b> ${escape(name)} &lt;${escape(email)}&gt;</p>
    <p><b>Organization:</b> ${escape(organization ?? '—')}</p>
    <p><b>Subject:</b> ${escape(subject)}</p>
    <hr/>
    <pre style="white-space:pre-wrap;font-family:system-ui">${escape(message)}</pre>
  `.trim()

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || 'fedanalyst@example.com',
      to: process.env.CONTACT_TO_EMAIL || 'you@example.com',
      replyTo: email,
      subject: `[fedAnalyst] ${subject}`,
      html,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, provider: 'resend' })
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      const nm = await import('nodemailer' as any).catch(() => null)
      if (!nm) {
        return NextResponse.json(
          { error: 'nodemailer not installed. Run: npm install nodemailer' },
          { status: 500 }
        )
      }
      const transporter = nm.default.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      })
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.CONTACT_TO_EMAIL || process.env.GMAIL_USER,
        replyTo: email,
        subject: `[fedAnalyst] ${subject}`,
        html,
      })
      return NextResponse.json({ ok: true, provider: 'gmail' })
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 })
    }
  }

  return NextResponse.json(
    { error: 'No email provider configured. Set RESEND_API_KEY or GMAIL_USER+GMAIL_APP_PASSWORD.' },
    { status: 500 }
  )
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
