import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

const YT = 'https://www.googleapis.com/youtube/v3'

// ── YouTube API response shapes ─────────────────────────────────────────────

interface YTSearchItem {
  id: { channelId?: string; videoId?: string }
  snippet: {
    title: string
    channelTitle: string
    publishedAt: string
    thumbnails: {
      default?: { url: string }
      medium?: { url: string }
      high?: { url: string }
    }
  }
}

interface YTChannelItem {
  id: string
  statistics: { subscriberCount?: string; hiddenSubscriberCount?: boolean }
}

interface YTVideoItem {
  id: string
  contentDetails: { duration: string }
}

// ── Public result shape returned to the client ───────────────────────────────

export interface YoutubeSearchResult {
  id: string
  title: string
  thumbnail: string
  channelName: string
  publishedAt?: string   // videos
  duration?: string      // videos — ISO 8601 (e.g. "PT4M13S")
  subscriberCount?: string // channels
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function thumbnail(item: YTSearchItem): string {
  const t = item.snippet.thumbnails
  return t.medium?.url ?? t.high?.url ?? t.default?.url ?? ''
}

async function fetchSubscriberCounts(
  ids: string[]
): Promise<Map<string, string>> {
  const params = new URLSearchParams({
    key: process.env.YOUTUBE_API_KEY!,
    id: ids.join(','),
    part: 'statistics',
  })
  const res = await fetch(`${YT}/channels?${params}`)
  if (!res.ok) return new Map()
  const data = await res.json() as { items: YTChannelItem[] }
  return new Map(
    data.items.map((ch) => [
      ch.id,
      ch.statistics.hiddenSubscriberCount ? 'Hidden' : (ch.statistics.subscriberCount ?? '0'),
    ])
  )
}

async function fetchDurations(ids: string[]): Promise<Map<string, string>> {
  const params = new URLSearchParams({
    key: process.env.YOUTUBE_API_KEY!,
    id: ids.join(','),
    part: 'contentDetails',
  })
  const res = await fetch(`${YT}/videos?${params}`)
  if (!res.ok) return new Map()
  const data = await res.json() as { items: YTVideoItem[] }
  return new Map(data.items.map((v) => [v.id, v.contentDetails.duration]))
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { query?: unknown; type?: unknown; order?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { query, type, order } = body

  if (
    typeof query !== 'string' ||
    !query.trim() ||
    (type !== 'channel' && type !== 'video')
  ) {
    return NextResponse.json(
      { error: '`query` (string) and `type` ("channel" | "video") are required' },
      { status: 400 }
    )
  }

  const searchParams = new URLSearchParams({
    key: process.env.YOUTUBE_API_KEY!,
    q: query.trim(),
    type,
    part: 'snippet',
    maxResults: '10',
  })

  if (typeof order === 'string' && order) {
    searchParams.append('order', order)
  }

  const searchRes = await fetch(`${YT}/search?${searchParams}`)
  if (!searchRes.ok) {
    const err = await searchRes.json() as { error?: { message?: string } }
    const message = err?.error?.message ?? 'YouTube API error'
    return NextResponse.json({ error: message }, { status: searchRes.status })
  }

  const searchData = await searchRes.json() as { items: YTSearchItem[] }
  const items: YTSearchItem[] = searchData.items ?? []

  if (type === 'channel') {
    const ids = items.map((item) => item.id.channelId!).filter(Boolean)
    const subCounts = ids.length ? await fetchSubscriberCounts(ids) : new Map<string, string>()

    const results: YoutubeSearchResult[] = items.map((item) => {
      const id = item.id.channelId!
      return {
        id,
        title: item.snippet.title,
        thumbnail: thumbnail(item),
        channelName: item.snippet.title,
        subscriberCount: subCounts.get(id),
      }
    })

    return NextResponse.json({ results })
  }

  // type === 'video'
  const ids = items.map((item) => item.id.videoId!).filter(Boolean)
  const durations = ids.length ? await fetchDurations(ids) : new Map<string, string>()

  const results: YoutubeSearchResult[] = items.map((item) => {
    const id = item.id.videoId!
    return {
      id,
      title: item.snippet.title,
      thumbnail: thumbnail(item),
      channelName: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      duration: durations.get(id),
    }
  })

  return NextResponse.json({ results })
}
