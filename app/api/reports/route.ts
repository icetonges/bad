import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/db/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createAdminSupabase()
  const category = req.nextUrl.searchParams.get('category')
  const id = req.nextUrl.searchParams.get('id')

  if (id) {
    const { data, error } = await admin.from('reports').select('*').eq('id', id).eq('user_id', user.id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ report: data })
  }

  let q = admin.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  if (category) q = q.eq('category', category)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reports: data })
}
