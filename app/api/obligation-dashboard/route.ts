import { NextRequest, NextResponse } from 'next/server'
import { sql, DEFAULT_WORKSPACE_ID, getWorkspaceId } from '@/lib/db/neon'

export const runtime = 'nodejs'
export const maxDuration = 15

/**
 * GET /api/obligation-dashboard
 *
 * Reads structured dashboard_data from the metadata column of the most recently
 * ingested usaspending document. No live API calls — instant response.
 * Automatically switches to the newest period as GitHub Action ingests new data.
 *
 * Optional: ?period=FY2026_P05 to request a specific period.
 */
export async function GET(req: NextRequest) {
  try {
    const workspaceId = getWorkspaceId(req) || DEFAULT_WORKSPACE_ID
    const requestedPeriod = req.nextUrl.searchParams.get('period')

    // Find the latest (or requested) auto-ingested obligation document
    const docs = requestedPeriod
      ? await sql`
          select id, filename, metadata, created_at
          from public.documents
          where workspace_id = ${workspaceId}::uuid
            and category = 'accounting'
            and metadata->>'auto_ingested' = 'true'
            and metadata->>'dataset' = 'dod_obligations'
            and filename like ${'%' + requestedPeriod + '%'}
          order by created_at desc
          limit 1
        `
      : await sql`
          select id, filename, metadata, created_at
          from public.documents
          where workspace_id = ${workspaceId}::uuid
            and category = 'accounting'
            and metadata->>'auto_ingested' = 'true'
            and metadata->>'dataset' = 'dod_obligations'
          order by created_at desc
          limit 1
        `

    if (!docs.length) {
      return NextResponse.json({
        error: 'No obligation data ingested yet. Run the GitHub Action to pull data.',
        hint: 'Go to your GitHub repo → Actions → DoD Obligation Data → Run workflow',
      }, { status: 404 })
    }

    const doc = docs[0] as any
    const meta = doc.metadata as any

    // Extract structured dashboard_data from metadata
    const dash = meta?.dashboard_data

    if (!dash) {
      return NextResponse.json({
        error: 'Document found but has no structured dashboard data. Re-run the GitHub Action with the latest script.',
        filename: doc.filename,
        pulled_at: doc.created_at,
      }, { status: 422 })
    }

    // List all available periods for the period selector
    const allDocs = await sql`
      select filename, created_at, metadata->>'period' as period_label
      from public.documents
      where workspace_id = ${workspaceId}::uuid
        and category = 'accounting'
        and metadata->>'auto_ingested' = 'true'
        and metadata->>'dataset' = 'dod_obligations'
      order by created_at desc
      limit 20
    `

    const availablePeriods = (allDocs as any[]).map(d => ({
      filename: d.filename,
      label: d.filename.replace('usaspending_dod_obligations_', '').replace('.txt', ''),
      pulled_at: d.created_at,
    }))

    return NextResponse.json({
      ...dash,
      filename: doc.filename,
      source: 'db',  // indicates data comes from DB, not live USASpending
      availablePeriods,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
