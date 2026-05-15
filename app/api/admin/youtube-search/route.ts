import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

const YT = 'https://www.googleapis.com/youtube/v3'

// ── YouTube API response shapes ─────────────────────────────────────────────

/** Represents an item in a YouTube search result list. */
interface YTSearchItem {
  /** The unique ID of the search result item. */
  id: { channelId?: string; videoId?: string }
  /** Snippet containing basic details about the search result. */
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

/** Represents a YouTube channel resource from the API. */
interface YTChannelItem {
  /** The unique ID of the channel. */
  id: string
  /** Statistics for the channel. */
  statistics: { subscriberCount?: string; hiddenSubscriberCount?: boolean }
}

/** Represents a YouTube video resource from the API. */
interface YTVideoItem {
  /** The unique ID of the video. */
  id: string
  /** Content details including video duration. */
  contentDetails: { duration: string }
}

// ── Public result shape returned to the client ───────────────────────────────

/** Represents a normalized search result returned to the client. */
export interface YoutubeSearchResult {
  /** The YouTube ID (channel or video). */
  id: string
  /** The title of the search result. */
  title: string
  /** URL to the result's thumbnail image. */
  thumbnail: string
  /** The name of the channel associated with the result. */
  channelName: string
  /** ISO timestamp of when the video was published (videos only). */
  publishedAt?: string
  /** ISO 8601 duration string (videos only). */
  duration?: string
  /** Total subscriber count as a string (channels only). */
  subscriberCount?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extracts the most suitable thumbnail URL from a search item.
 *
 * @param item - The YouTube search item.
 * @returns A thumbnail URL string.
 */
function thumbnail(item: YTSearchItem): string {
  const t = item.snippet.thumbnails
  return t.medium?.url ?? t.high?.url ?? t.default?.url ?? ''
}

/**
 * Fetches subscriber counts for a list of channel IDs.
 *
 * @param ids - An array of YouTube channel IDs.
 * @returns A Map of channel IDs to subscriber count strings.
 */
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

/**
 * Fetches durations for a list of video IDs.
 *
 * @param ids - An array of YouTube video IDs.
 * @returns A Map of video IDs to ISO 8601 duration strings.
 */
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

/**
 * POST handler for searching YouTube channels or videos.
 * Requires a valid parent session and a YouTube API key.
 *
 * @param request - The incoming request containing the search query and type.
 * @returns A JSON response containing a list of normalized YouTube search results.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { query?: unknown; type?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { query, type } = body

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
