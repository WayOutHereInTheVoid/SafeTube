import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getChildSession } from '@/lib/child-session'

/**
 * GET handler for retrieving the child's playlist of approved videos.
 * Requires a valid child session.
 *
 * @returns A JSON response containing an array of approved videos.
 */
export async function GET() {
  const session = await getChildSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('approved_videos')
    .select('id, youtube_video_id, title, thumbnail_url, duration')
    .eq('parent_id', session.parent_id)
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  return NextResponse.json({ videos: data ?? [] })
}
