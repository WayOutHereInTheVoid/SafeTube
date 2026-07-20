// Shared YouTube Data API helpers — runtime-neutral (Node 18+, Deno).
// Every function accepts apiKey as a parameter; callers read it from their env.

const YT = 'https://www.googleapis.com/youtube/v3'

export interface YTPlaylistItem {
  contentDetails?: { videoId?: string }
  snippet?: {
    resourceId?: { videoId?: string }
    thumbnails?: {
      medium?: { url: string }
      high?: { url: string }
      default?: { url: string }
    }
    publishedAt?: string
  }
}

export interface YTVideoItem {
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

export async function getUploadsPlaylistId(channelId: string, apiKey: string): Promise<string | null> {
  const url = new URL(`${YT}/channels`)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('id', channelId)
  url.searchParams.set('part', 'contentDetails')
  const res = await fetch(url.toString())
  if (!res.ok) return null
  const data = await res.json() as {
    items?: Array<{ contentDetails?: { relatedPlaylists?: { uploads?: string } } }>
  }
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null
}

export async function fetchPlaylistVideos(playlistId: string, apiKey: string): Promise<YTPlaylistItem[]> {
  const url = new URL(`${YT}/playlistItems`)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('playlistId', playlistId)
  url.searchParams.set('part', 'snippet,contentDetails')
  url.searchParams.set('maxResults', '50')
  const res = await fetch(url.toString())
  if (!res.ok) return []
  const data = await res.json() as { items?: YTPlaylistItem[] }
  return data.items ?? []
}

export async function fetchVideoDetails(videoIds: string[], apiKey: string): Promise<YTVideoItem[]> {
  if (!videoIds.length) return []
  const url = new URL(`${YT}/videos`)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('id', videoIds.join(','))
  url.searchParams.set('part', 'snippet,contentDetails,status')
  const res = await fetch(url.toString())
  if (!res.ok) return []
  const data = await res.json() as { items?: YTVideoItem[] }
  return data.items ?? []
}

export function isPublicAndEmbeddable(video: YTVideoItem): boolean {
  const s = video.status
  if (!s) return true
  return s.privacyStatus === 'public' && s.embeddable !== false
}

export async function fetchChannelVideos(
  channelId: string,
  apiKey: string
): Promise<{ videoIds: string[]; detailsMap: Map<string, YTVideoItem> }> {
  const uploadsPlaylistId = await getUploadsPlaylistId(channelId, apiKey)
  if (!uploadsPlaylistId) return { videoIds: [], detailsMap: new Map() }

  const playlistItems = await fetchPlaylistVideos(uploadsPlaylistId, apiKey)
  const videoIds = playlistItems
    .map(item => item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId)
    .filter((id): id is string => Boolean(id))

  if (!videoIds.length) return { videoIds: [], detailsMap: new Map() }

  const videoDetails = await fetchVideoDetails(videoIds, apiKey)
  const detailsMap = new Map(videoDetails.map(v => [v.id, v]))

  return { videoIds, detailsMap }
}
