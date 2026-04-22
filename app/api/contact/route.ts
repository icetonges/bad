import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { z } from 'zod'

export const runtime = 'nodejs'
export const maxDuration = 20

const Schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  organization: z.string().max(200).optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid input', issues: parsed.error.issues }, { status: 400 })
  }
  const { name, email, organization, subject, message } = parsed.data

  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD
  if (!gmailUser || !gmailPass) {
    return NextResponse.json(
      { error: 'GMAIL_USER and GMAIL_APP_PASSWORD must be set in environment' },
      { status: 500 }
    )
  }

  const to = process.env.CONTACT_TO_EMAIL || gmailUser

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px">
      <h2 style="margin:0 0 16px">fedAnalyst contact form</h2>
      <table style="border-collapse:collapse;font-size:14px">
        <tr><td style="padding:4px 16px 4px 0;color:#666">From</td><td style="padding:4px 0"><b>${escape(name)}</b> &lt;${escape(email)}&gt;</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666">Organization</td><td style="padding:4px 0">${escape(organization ?? '—')}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666">Subject</td><td style="padding:4px 0">${escape(subject)}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
      <pre style="white-space:pre-wrap;font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.6;margin:0">${escape(message)}</pre>
    </div>
  `.trim()

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    })

    await transporter.sendMail({
      from: `"fedAnalyst" <${gmailUser}>`,
      to,
      replyTo: email,
      subject: `[fedAnalyst] ${subject}`,
      html,
      text: `From: ${name} <${email}>\nOrganization: ${organization ?? '—'}\nSubject: ${subject}\n\n${message}`,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
