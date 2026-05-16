import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getChildSession } from '@/lib/child-session'

export async function POST(request: NextRequest) {
  const session = await getChildSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { video_id?: unknown; watched_seconds?: unknown; completed?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { video_id, watched_seconds, completed } = body

  if (typeof video_id !== 'string' || !video_id) {
    return NextResponse.json({ error: '`video_id` is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin.from('watch_history').insert({
    child_profile_id: session.sub,
    video_id,
    watched_seconds: typeof watched_seconds === 'number' ? Math.max(0, Math.round(watched_seconds)) : 0,
    completed: completed === true,
  })

  if (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
