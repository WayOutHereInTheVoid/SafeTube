import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getChildSession } from '@/lib/child-session'

export async function POST(request: NextRequest) {
  const session = await getChildSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { video_id?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { video_id } = body

  if (typeof video_id !== 'string' || !video_id) {
    return NextResponse.json({ error: '`video_id` is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('watch_history')
    .insert({
      child_profile_id: session.sub,
      video_id,
      watched_seconds: 0,
      completed: false,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
