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

  const { id } = params
  if (!id) {
    return NextResponse.json({ error: 'History ID is required' }, { status: 400 })
  }

  let body: { watched_seconds?: unknown; completed?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { watched_seconds, completed } = body

  const updateData: { watched_seconds?: number; completed?: boolean } = {}

  if (typeof watched_seconds === 'number') {
    updateData.watched_seconds = Math.max(0, Math.round(watched_seconds))
  }

  if (typeof completed === 'boolean') {
    updateData.completed = completed
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('watch_history')
    .update(updateData)
    .eq('id', id)
    .eq('child_profile_id', session.sub)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'History record not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data })
}
