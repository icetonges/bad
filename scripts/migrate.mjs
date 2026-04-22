#!/usr/bin/env node
/**
 * Apply SQL migrations to Neon.
 * Usage: node scripts/migrate.mjs
 * Reads DATABASE_URL from .env.local or environment.
 */
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { neon } from '@neondatabase/serverless'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local if present
try {
  const env = readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
  for (const line of env.split('\n')) {
    const [k, ...rest] = line.split('=')
    if (!k || k.startsWith('#') || !rest.length) continue
    process.env[k.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '')
  }
} catch {}

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL not set. Fill in .env.local first.')
  process.exit(1)
}

const sql = neon(url)
const migrationsDir = join(__dirname, '..', 'db', 'migrations')
const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()

console.log(`Applying ${files.length} migration(s) to ${new URL(url).host}`)

for (const file of files) {
  console.log(`  → ${file}`)
  const contents = readFileSync(join(migrationsDir, file), 'utf8')
  // Neon doesn't support multi-statement; split on semicolons at end of line
  const statements = contents
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--'))
  for (const stmt of statements) {
    try {
      await sql.query(stmt)
    } catch (e) {
      console.error(`    failed: ${e.message}`)
      console.error(`    statement: ${stmt.slice(0, 100)}...`)
      process.exit(1)
    }
  }
}

console.log('✓ Migrations complete')
