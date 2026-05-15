import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { youtube_video_id, title, thumbnail_url, channel_id, channel_name, duration, published_at } =
    body

  if (typeof youtube_video_id !== 'string' || typeof title !== 'string') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check that the video is embeddable before approving
  const ytRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${youtube_video_id}&part=status&key=${process.env.YOUTUBE_API_KEY}`
  )
  if (ytRes.ok) {
    const ytData = await ytRes.json() as { items?: Array<{ status?: { embeddable?: boolean } }> }
    const embeddable = ytData.items?.[0]?.status?.embeddable
    if (embeddable === false) {
      return NextResponse.json(
        { error: "This video can't be embedded and cannot be approved." },
        { status: 422 }
      )
    }
  }

  // Upsert: if video already exists (e.g. from a channel sync), mark it approved
  const { data, error } = await supabase
    .from('approved_videos')
    .upsert(
      {
        parent_id: user.id,
        youtube_video_id,
        title,
        thumbnail_url: thumbnail_url ?? null,
        channel_id: channel_id ?? null,
        channel_name: channel_name ?? null,
        duration: duration ?? null,
        published_at: published_at ?? null,
        approval_status: 'approved',
        source: 'manual',
      },
      { onConflict: 'parent_id,youtube_video_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ video: data }, { status: 201 })
}
