import { neon, neonConfig, Pool } from '@neondatabase/serverless'

neonConfig.fetchConnectionCache = true

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  if (typeof window === 'undefined') console.warn('DATABASE_URL not set')
}

export const sql = connectionString ? neon(connectionString) : (null as any)

export function getPool() {
  if (!connectionString) throw new Error('DATABASE_URL not set')
  return new Pool({ connectionString })
}

export const DEFAULT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001'

export function getWorkspaceId(req?: { headers: Headers }): string {
  if (!req) return DEFAULT_WORKSPACE_ID
  const id = req.headers.get('x-workspace-id')
  return id || DEFAULT_WORKSPACE_ID
}
