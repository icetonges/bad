import { NextResponse } from 'next/server'
import { sql } from '@/lib/db/neon'

export const runtime = 'nodejs'
export const maxDuration = 15

/**
 * GET /api/health
 *
 * Returns a diagnostic snapshot of what's configured and what works.
 * Use this to debug a deployment: does it have the env vars it needs,
 * does the database respond, do the required tables exist.
 *
 * Not a secret — no keys are returned, just presence booleans.
 */
export async function GET() {
  const env = {
    GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    DATABASE_URL: !!process.env.DATABASE_URL,
    BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
    GMAIL_USER: !!process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: !!process.env.GMAIL_APP_PASSWORD,
    CONTACT_TO_EMAIL: !!process.env.CONTACT_TO_EMAIL,
  }

  const missing = Object.entries(env).filter(([, v]) => !v).map(([k]) => k)

  const db: {
    connected: boolean
    error?: string
    tables?: Record<string, boolean>
    extensions?: Record<string, boolean>
  } = { connected: false }

  if (env.DATABASE_URL) {
    try {
      const ping = await sql`select 1 as ok`
      db.connected = ping[0]?.ok === 1

      const expected = ['workspaces', 'documents', 'chunks', 'chat_sessions', 'chat_messages', 'reports']
      const foundRows = await sql`
        select table_name from information_schema.tables
        where table_schema = 'public' and table_name = any(${expected}::text[])
      `
      const found = new Set(foundRows.map((r: any) => r.table_name))
      db.tables = Object.fromEntries(expected.map((t) => [t, found.has(t)]))

      const extRows = await sql`
        select extname from pg_extension where extname in ('vector', 'uuid-ossp')
      `
      const extFound = new Set(extRows.map((r: any) => r.extname))
      db.extensions = {
        vector: extFound.has('vector'),
        'uuid-ossp': extFound.has('uuid-ossp'),
      }
    } catch (e: any) {
      db.error = e?.message || String(e)
    }
  }

  const missingTables = db.tables
    ? Object.entries(db.tables).filter(([, ok]) => !ok).map(([k]) => k)
    : []

  const allOk =
    missing.length === 0 &&
    db.connected &&
    missingTables.length === 0 &&
    db.extensions?.vector === true

  return NextResponse.json({
    ok: allOk,
    env: { ...env, missing },
    db,
    next_steps: buildNextSteps(missing, db, missingTables),
  }, { status: allOk ? 200 : 503 })
}

function buildNextSteps(missing: string[], db: any, missingTables: string[]): string[] {
  const steps: string[] = []
  if (missing.length) {
    steps.push(`Add missing env vars in Vercel: ${missing.join(', ')}. Make sure Production scope is checked.`)
  }
  if (missing.includes('DATABASE_URL')) {
    steps.push('Set DATABASE_URL to your Neon pooled connection string (has -pooler in the hostname).')
  }
  if (db.error) {
    steps.push(`DB connection failed: ${db.error}. Check DATABASE_URL is valid and Neon isn't suspended.`)
  }
  if (db.extensions && !db.extensions.vector) {
    steps.push("pgvector extension not installed. In Neon SQL editor run: CREATE EXTENSION IF NOT EXISTS vector;")
  }
  if (missingTables.length) {
    steps.push(`Database tables missing: ${missingTables.join(', ')}. Run: npm run db:migrate`)
  }
  return steps
}
