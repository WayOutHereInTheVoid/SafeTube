import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getChildSession } from '@/lib/child-session'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getChildSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { watched_seconds?: unknown; completed?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { watched_seconds, completed } = body
  const update: { watched_seconds?: number; completed?: boolean } = {}

  if (typeof watched_seconds === 'number') {
    update.watched_seconds = Math.max(0, Math.round(watched_seconds))
  }
  if (typeof completed === 'boolean') {
    update.completed = completed
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('watch_history')
    .update(update)
    .eq('id', params.id)
    .eq('child_profile_id', session.sub)

  if (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
