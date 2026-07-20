import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import {
  fetchChannelVideos,
  fetchVideoDetails,
  isPublicAndEmbeddable,
} from "../_shared/youtube.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY') ?? ''

interface ChannelRow {
  id: string
  parent_id: string
  youtube_channel_id: string
  channel_title: string
  approval_mode: string
  auto_approve_new: boolean
}

Deno.serve(async (req: Request) => {
  if (!YOUTUBE_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'YOUTUBE_API_KEY secret not configured in Supabase' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let parentId: string | undefined
  try {
    const body = await req.json() as { parent_id?: string }
    parentId = body.parent_id
  } catch {
    // Body optional — no parent_id means sync all channels (cron path)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  let channelsQuery = supabase
    .from('approved_channels')
    .select('*')
    .neq('approval_mode', 'current_only')

  if (parentId) {
    channelsQuery = channelsQuery.eq('parent_id', parentId)
  }

  const { data: channels, error: channelsError } = await channelsQuery

  if (channelsError) {
    return new Response(JSON.stringify({ error: channelsError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const results: Array<{
    channelId: string
    added: number
    verified: number
    rejected: number
    error?: string
  }> = []

  for (const channel of (channels as ChannelRow[]) ?? []) {
    const result = { channelId: channel.youtube_channel_id, added: 0, verified: 0, rejected: 0 }

    try {
      // Steps 1–3: fetch recent uploads and their details
      const { videoIds, detailsMap } = await fetchChannelVideos(
        channel.youtube_channel_id,
        YOUTUBE_API_KEY
      )

      if (!videoIds.length) {
        results.push(result)
        continue
      }

      // Step 4: find which video IDs are already in approved_videos
      const { data: existing } = await supabase
        .from('approved_videos')
        .select('youtube_video_id')
        .eq('parent_id', channel.parent_id)
        .in('youtube_video_id', videoIds)

      const existingIds = new Set(existing?.map((v: { youtube_video_id: string }) => v.youtube_video_id) ?? [])

      // Step 5: insert new public videos with the appropriate status
      const newVideos: Record<string, unknown>[] = []
      for (const videoId of videoIds) {
        if (existingIds.has(videoId)) continue
        const detail = detailsMap.get(videoId)
        if (!detail || !isPublicAndEmbeddable(detail)) continue
        const t = detail.snippet?.thumbnails
        newVideos.push({
          parent_id: channel.parent_id,
          youtube_video_id: videoId,
          title: detail.snippet?.title ?? 'Unknown',
          thumbnail_url: t?.medium?.url ?? t?.high?.url ?? t?.default?.url ?? null,
          channel_id: channel.youtube_channel_id,
          channel_name: channel.channel_title,
          duration: detail.contentDetails?.duration ?? null,
          published_at: detail.snippet?.publishedAt ?? null,
          approval_status: channel.auto_approve_new ? 'approved' : 'pending',
          source: 'channel_sync',
          last_verified_at: new Date().toISOString(),
        })
      }

      if (newVideos.length) {
        const { error: insertError } = await supabase.from('approved_videos').insert(newVideos)
        if (!insertError) result.added = newVideos.length
      }

      // Step 6: verify existing approved videos for this channel are still public
      const { data: approvedVideos } = await supabase
        .from('approved_videos')
        .select('id, youtube_video_id')
        .eq('parent_id', channel.parent_id)
        .eq('channel_id', channel.youtube_channel_id)
        .eq('approval_status', 'approved')

      if (approvedVideos?.length) {
        const BATCH = 50
        for (let i = 0; i < approvedVideos.length; i += BATCH) {
          const batch = approvedVideos.slice(i, i + BATCH)
          const batchIds = batch.map((v: { youtube_video_id: string }) => v.youtube_video_id)
          const details = await fetchVideoDetails(batchIds, YOUTUBE_API_KEY)
          const detailMap = new Map(details.map(v => [v.id, v]))
          const now = new Date().toISOString()

          for (const video of batch) {
            const detail = detailMap.get(video.youtube_video_id)
            if (!detail || !isPublicAndEmbeddable(detail)) {
              await supabase
                .from('approved_videos')
                .update({ approval_status: 'rejected', last_verified_at: now })
                .eq('id', video.id)
              result.rejected++
            } else {
              await supabase
                .from('approved_videos')
                .update({ last_verified_at: now })
                .eq('id', video.id)
              result.verified++
            }
          }
        }
      }
    } catch (err: unknown) {
      result.error = err instanceof Error ? err.message : 'Unknown error'
    }

    results.push(result)
  }

  return new Response(
    JSON.stringify({
      synced: results.length,
      total_added: results.reduce((s, r) => s + r.added, 0),
      total_rejected: results.reduce((s, r) => s + r.rejected, 0),
      results,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
