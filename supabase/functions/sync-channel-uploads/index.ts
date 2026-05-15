import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY') ?? ''
const YT = 'https://www.googleapis.com/youtube/v3'

// ── YouTube API types ─────────────────────────────────────────────────────────

interface YTPlaylistItem {
  contentDetails?: { videoId?: string }
  snippet?: {
    resourceId?: { videoId?: string }
    title?: string
    thumbnails?: {
      medium?: { url: string }
      high?: { url: string }
      default?: { url: string }
    }
    publishedAt?: string
  }
}

interface YTVideoItem {
  id: string
  snippet?: {
    title?: string
    thumbnails?: {
      medium?: { url: string }
      high?: { url: string }
      default?: { url: string }
    }
    publishedAt?: string
  }
  contentDetails?: { duration?: string }
  status?: { privacyStatus?: string; embeddable?: boolean }
}

interface ChannelRow {
  id: string
  parent_id: string
  youtube_channel_id: string
  channel_title: string
  approval_mode: string
  auto_approve_new: boolean
}

// ── YouTube helpers ───────────────────────────────────────────────────────────

async function getUploadsPlaylistId(channelId: string): Promise<string | null> {
  const url = new URL(`${YT}/channels`)
  url.searchParams.set('key', YOUTUBE_API_KEY)
  url.searchParams.set('id', channelId)
  url.searchParams.set('part', 'contentDetails')
  const res = await fetch(url.toString())
  if (!res.ok) return null
  const data = await res.json() as {
    items?: Array<{ contentDetails?: { relatedPlaylists?: { uploads?: string } } }>
  }
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null
}

async function fetchPlaylistVideos(playlistId: string): Promise<YTPlaylistItem[]> {
  const url = new URL(`${YT}/playlistItems`)
  url.searchParams.set('key', YOUTUBE_API_KEY)
  url.searchParams.set('playlistId', playlistId)
  url.searchParams.set('part', 'snippet,contentDetails')
  url.searchParams.set('maxResults', '50')
  const res = await fetch(url.toString())
  if (!res.ok) return []
  const data = await res.json() as { items?: YTPlaylistItem[] }
  return data.items ?? []
}

async function fetchVideoDetails(videoIds: string[]): Promise<YTVideoItem[]> {
  if (!videoIds.length) return []
  const url = new URL(`${YT}/videos`)
  url.searchParams.set('key', YOUTUBE_API_KEY)
  url.searchParams.set('id', videoIds.join(','))
  url.searchParams.set('part', 'snippet,contentDetails,status')
  const res = await fetch(url.toString())
  if (!res.ok) return []
  const data = await res.json() as { items?: YTVideoItem[] }
  return data.items ?? []
}

function isPublicAndEmbeddable(video: YTVideoItem): boolean {
  const s = video.status
  if (!s) return true
  return s.privacyStatus === 'public' && s.embeddable !== false
}

// ── Main handler ──────────────────────────────────────────────────────────────

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
      // Step 1: get uploads playlist ID for this channel
      const uploadsPlaylistId = await getUploadsPlaylistId(channel.youtube_channel_id)
      if (!uploadsPlaylistId) {
        result.error = 'Could not resolve uploads playlist'
        results.push(result)
        continue
      }

      // Step 2: fetch the 50 most recent uploads
      const playlistItems = await fetchPlaylistVideos(uploadsPlaylistId)
      const videoIds = playlistItems
        .map(item => item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId)
        .filter((id): id is string => Boolean(id))

      if (!videoIds.length) {
        results.push(result)
        continue
      }

      // Step 3: get full details (status, duration, thumbnails)
      const videoDetails = await fetchVideoDetails(videoIds)
      const detailsMap = new Map(videoDetails.map(v => [v.id, v]))

      // Step 4: find which video IDs are already in approved_videos
      const { data: existing } = await supabase
        .from('approved_videos')
        .select('youtube_video_id')
        .eq('parent_id', channel.parent_id)
        .in('youtube_video_id', videoIds)

      const existingIds = new Set(existing?.map(v => v.youtube_video_id) ?? [])

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
        // Process in batches of 50 (YouTube API limit per request)
        const BATCH = 50
        for (let i = 0; i < approvedVideos.length; i += BATCH) {
          const batch = approvedVideos.slice(i, i + BATCH)
          const batchIds = batch.map(v => v.youtube_video_id)
          const details = await fetchVideoDetails(batchIds)
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
