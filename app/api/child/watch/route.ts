import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getChildSession } from '@/lib/child-session'

/**
 * POST handler for logging watch history.
 * Requires a valid child session.
 *
 * @param request - The incoming request containing video_id, watched_seconds, and completed status.
 * @returns A JSON response indicating success or failure.
 */
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

  // Verify the video belongs to this child's parent and is approved
  const { data: video, error: videoError } = await admin
    .from('approved_videos')
    .select('id')
    .eq('id', video_id)
    .eq('parent_id', session.parent_id)
    .eq('approval_status', 'approved')
    .single()

  if (videoError || !video) {
    return NextResponse.json({ error: 'Video not found or not approved' }, { status: 404 })
  }

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
