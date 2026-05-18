import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse, type NextRequest } from 'next/server'
import type { ApprovalMode } from '@/types/database'
import { fetchChannelVideos, isPublicAndEmbeddable } from '@/lib/youtube'

const VALID_MODES: ApprovalMode[] = ['auto', 'manual', 'current_only']

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

  const { youtube_channel_id, channel_title, thumbnail_url, approval_mode, auto_approve_new } =
    body

  if (
    typeof youtube_channel_id !== 'string' ||
    typeof channel_title !== 'string' ||
    !VALID_MODES.includes(approval_mode as ApprovalMode)
  ) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  const autoApprove = Boolean(auto_approve_new)

  const { data, error } = await supabase
    .from('approved_channels')
    .insert({
      parent_id: user.id,
      youtube_channel_id,
      channel_title,
      thumbnail_url: thumbnail_url ?? null,
      approval_mode,
      auto_approve_new: autoApprove,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Channel already added' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Immediately populate videos — skip for current_only (no sync ever)
  let videos_added = 0
  if (approval_mode !== 'current_only') {
    const apiKey = process.env.YOUTUBE_API_KEY
    if (apiKey) {
      try {
        const { videoIds, detailsMap } = await fetchChannelVideos(youtube_channel_id, apiKey)

        if (videoIds.length) {
          const admin = createAdminClient()

          const { data: existing } = await admin
            .from('approved_videos')
            .select('youtube_video_id')
            .eq('parent_id', user.id)
            .in('youtube_video_id', videoIds)

          const existingIds = new Set(
            (existing ?? []).map((v: { youtube_video_id: string }) => v.youtube_video_id)
          )

          const newVideos = []
          for (const videoId of videoIds) {
            if (existingIds.has(videoId)) continue
            const detail = detailsMap.get(videoId)
            if (!detail || !isPublicAndEmbeddable(detail)) continue
            const t = detail.snippet?.thumbnails
            newVideos.push({
              parent_id: user.id,
              youtube_video_id: videoId,
              title: detail.snippet?.title ?? 'Unknown',
              thumbnail_url: t?.medium?.url ?? t?.high?.url ?? t?.default?.url ?? null,
              channel_id: youtube_channel_id,
              channel_name: channel_title,
              duration: detail.contentDetails?.duration ?? null,
              published_at: detail.snippet?.publishedAt ?? null,
              approval_status: autoApprove ? 'approved' : 'pending',
              source: 'channel_sync',
              last_verified_at: new Date().toISOString(),
            })
          }

          if (newVideos.length) {
            const { error: insertError } = await admin.from('approved_videos').insert(newVideos)
            if (!insertError) videos_added = newVideos.length
          }
        }
      } catch (err) {
        console.error('[channel-sync] Initial video fetch failed:', err)
      }
    }
  }

  return NextResponse.json({ channel: data, videos_added }, { status: 201 })
}
