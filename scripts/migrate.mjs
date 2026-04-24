#!/usr/bin/env node
/**
 * Apply SQL migrations to Neon.
 *
 * FIX: uses @neondatabase/serverless Pool (standard pg-compatible interface)
 * instead of the neon() tagged-template, which does NOT have a .query() method.
 *
 * Usage:  node scripts/migrate.mjs
 * Env:    DATABASE_URL (read from .env.local or process env)
 */
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Pool, neonConfig } from '@neondatabase/serverless'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Required for Pool in a Node.js (non-edge) environment
import ws from 'ws'
neonConfig.webSocketConstructor = ws

// Load .env.local if present
try {
  const env = readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
  for (const raw of env.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx < 1) continue
    const k = line.slice(0, idx).trim()
    const v = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
} catch {}

const url = process.env.DATABASE_URL
if (!url) {
  console.error('\n❌ DATABASE_URL not set.')
  console.error('   Fill in .env.local with DATABASE_URL=postgres://...\n')
  process.exit(1)
}

let host
try { host = new URL(url).host } catch { host = '(unparseable)' }

// Pool gives us a standard client.query(string) interface
const pool = new Pool({ connectionString: url })
const client = await pool.connect()

const migrationsDir = join(__dirname, '..', 'db', 'migrations')
const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()

console.log(`\n→ Applying ${files.length} migration(s) to ${host}\n`)

// Split SQL on `;` at end-of-statement, but NOT inside $$...$$ function bodies
function splitStatements(sqlText) {
  const statements = []
  let current = ''
  let inDollar = false
  let inSingle = false

  for (let i = 0; i < sqlText.length; i++) {
    const ch = sqlText[i]
    const next2 = sqlText.substr(i, 2)

    if (!inSingle && next2 === '$$') {
      inDollar = !inDollar
      current += next2
      i++
      continue
    }
    if (!inDollar && ch === "'") {
      inSingle = !inSingle
      current += ch
      continue
    }
    if (!inDollar && !inSingle && ch === ';') {
      const trimmed = current.trim()
      if (trimmed) statements.push(trimmed)
      current = ''
      continue
    }
    current += ch
  }
  const last = current.trim()
  if (last) statements.push(last)
  return statements
}

function stripComments(sqlText) {
  return sqlText
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('--')
      return idx >= 0 ? line.slice(0, idx) : line
    })
    .join('\n')
}

let totalOk = 0
let totalSkipped = 0

try {
  for (const file of files) {
    console.log(`  ${file}`)
    const contents = stripComments(readFileSync(join(migrationsDir, file), 'utf8'))
    const statements = splitStatements(contents)

    for (const stmt of statements) {
      if (!stmt.trim()) continue
      const preview = stmt.replace(/\s+/g, ' ').slice(0, 70)
      try {
        await client.query(stmt)          // ← standard pg .query() — works on Pool client
        totalOk++
        console.log(`    ✓ ${preview}${preview.length >= 70 ? '...' : ''}`)
      } catch (e) {
        const msg = e.message || String(e)

        // Idempotent failures — safe to skip
        if (/already exists/i.test(msg) || /duplicate key/i.test(msg)) {
          totalSkipped++
          console.log(`    ⊙ ${preview} (already exists — skipped)`)
          continue
        }

        console.error(`\n❌ Failed on statement:\n    ${preview}${preview.length >= 70 ? '...' : ''}`)
        console.error(`   Error: ${msg}`)
        console.error(`\n   Full statement:`)
        console.error(stmt.split('\n').map((l) => '     ' + l).join('\n'))

        if (/permission denied/i.test(msg)) {
          console.error(`\n   💡 Permission error. Use the owner role in DATABASE_URL (not a restricted role).\n`)
        } else if (/extension.*not.*available/i.test(msg) || /could not open extension/i.test(msg)) {
          console.error(`\n   💡 Extension unavailable. In Neon SQL editor run:`)
          console.error(`      CREATE EXTENSION IF NOT EXISTS vector;`)
          console.error(`      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n`)
        } else if (/relation .* does not exist/i.test(msg)) {
          console.error(`\n   💡 Dependent table missing — an earlier statement may have failed.\n`)
        } else if (/webSocket/i.test(msg) || /ECONNREFUSED/i.test(msg)) {
          console.error(`\n   💡 Connection error. Check DATABASE_URL is the pooled connection string`)
          console.error(`      (should contain -pooler in the hostname) and that Neon is not suspended.\n`)
        }

        client.release()
        await pool.end()
        process.exit(1)
      }
    }
  }
} finally {
  client.release()
  await pool.end()
}

console.log(`\n✓ Migration complete — ${totalOk} statement(s) applied, ${totalSkipped} skipped (already existed)\n`)
