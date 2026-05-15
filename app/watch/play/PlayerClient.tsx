'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import YouTube from 'react-youtube'
import { Film, ChevronLeft } from 'lucide-react'
import type { YouTubeEvent, YouTubePlayer } from 'react-youtube'

/** Represents a video in the child's playlist. */
interface PlaylistVideo {
  /** Unique ID of the video record. */
  id: string
  /** YouTube's internal video ID. */
  youtube_video_id: string
  /** Title of the video. */
  title: string
  /** URL to the video's thumbnail image. */
  thumbnail_url: string | null
  /** Formatted duration of the video. */
  duration: string | null
}

/** Interval for periodic watch history logging. */
const LOG_INTERVAL_MS = 30_000

/**
 * Client-side component for the child's YouTube player.
 * Fetches the playlist, handles video playback, and logs watch history.
 *
 * @returns A player client component.
 */
export default function PlayerClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fullscreen = searchParams.get('fullscreen') === 'true'

  const [videos, setVideos] = useState<PlaylistVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const logIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Fetch playlist on mount ───────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/child/playlist')
      if (res.status === 401) {
        router.replace('/watch')
        return
      }
      const data = await res.json()
      setVideos(data.videos ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  // ── Watch-history logging ─────────────────────────────────────────────────

  /**
   * Logs a watch history entry to the API.
   *
   * @param videoId - The ID of the video record.
   * @param completed - Whether the video was finished.
   */
  const logWatch = useCallback(
    async (videoId: string, completed: boolean) => {
      if (!playerRef.current) return
      const seconds = Math.floor(playerRef.current.getCurrentTime?.() ?? 0)
      await fetch('/api/child/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId, watched_seconds: seconds, completed }),
      }).catch(() => {/* best-effort */})
    },
    []
  )

  useEffect(() => {
    if (currentIndex === null || videos.length === 0) return
    const video = videos[currentIndex]

    if (logIntervalRef.current) clearInterval(logIntervalRef.current)

    logIntervalRef.current = setInterval(() => {
      logWatch(video.id, false)
    }, LOG_INTERVAL_MS)

    return () => {
      if (logIntervalRef.current) clearInterval(logIntervalRef.current)
    }
  }, [currentIndex, videos, logWatch])

  // ── YouTube player event handlers ─────────────────────────────────────────

  /**
   * Handles the YouTube player's ready event.
   *
   * @param event - The YouTube event object.
   */
  function handleReady(event: YouTubeEvent) {
    playerRef.current = event.target
  }

  /**
   * Handles the end of a video playback.
   * Logs completion and advances to the next video in the playlist.
   */
  function handleEnd() {
    if (currentIndex === null || videos.length === 0) return
    logWatch(videos[currentIndex].id, true)
    setCurrentIndex((i) => ((i ?? 0) + 1) % videos.length)
  }

  /**
   * Handles state changes in the YouTube player.
   *
   * @param event - The YouTube event object.
   */
  function handleStateChange(event: YouTubeEvent) {
    // State 0 = ended (handled by onEnd), 1 = playing, 2 = paused
    if (event.data === 0) return
    playerRef.current = event.target
  }

  // ── Select a video ────────────────────────────────────────────────────────

  /**
   * Selects and starts playing a video from the grid.
   *
   * @param index - The index of the video in the playlist.
   */
  function selectVideo(index: number) {
    if (currentIndex !== null && videos[currentIndex]) {
      logWatch(videos[currentIndex].id, false)
    }
    setCurrentIndex(index)
  }

  // ── Loading / empty states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center px-6">
        <Film size={56} className="text-gray-700" />
        <h2 className="mt-4 text-2xl font-bold text-white">No videos yet</h2>
        <p className="mt-2 text-gray-400">Ask a parent to add some videos!</p>
      </div>
    )
  }

  const currentVideo = currentIndex !== null ? videos[currentIndex] : null

  // ── Fullscreen mode (Task 14) ─────────────────────────────────────────────

  if (fullscreen && currentVideo) {
    return (
      <div
        className="min-h-screen bg-black flex items-center justify-center"
        style={{ touchAction: 'none' }}
      >
        <div className="relative w-full h-screen">
          <YouTube
            videoId={currentVideo.youtube_video_id}
            opts={{
              width: '100%',
              height: '100%',
              playerVars: {
                rel: 0,
                modestbranding: 1,
                controls: 1,
                autoplay: 1,
                fs: 1,
                iv_load_policy: 3,
              },
            }}
            className="w-full h-full"
            iframeClassName="w-full h-full"
            onReady={handleReady}
            onEnd={handleEnd}
            onStateChange={handleStateChange}
          />
          {/* Block YouTube logo link */}
          <div className="absolute bottom-12 left-0 w-28 h-8 z-10" style={{ touchAction: 'none' }} />
        </div>
      </div>
    )
  }

  // ── Normal mode ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* Player area */}
      <div className="w-full bg-black relative" style={{ touchAction: 'none' }}>
        {currentVideo ? (
          <>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <div className="absolute inset-0">
                <YouTube
                  videoId={currentVideo.youtube_video_id}
                  opts={{
                    width: '100%',
                    height: '100%',
                    playerVars: {
                      rel: 0,
                      modestbranding: 1,
                      controls: 1,
                      autoplay: 1,
                      fs: 1,
                      iv_load_policy: 3,
                    },
                  }}
                  className="w-full h-full"
                  iframeClassName="w-full h-full"
                  onReady={handleReady}
                  onEnd={handleEnd}
                  onStateChange={handleStateChange}
                />
                {/* Block YouTube logo link — covers bottom-left branding area */}
                <div className="absolute bottom-10 left-0 w-28 h-8 z-10" />
              </div>
            </div>

            {/* "Watching" indicator */}
            <div className="bg-gray-900 px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => setCurrentIndex(null)}
                className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                aria-label="Back to grid"
              >
                <ChevronLeft size={22} />
              </button>
              <p className="text-white font-medium text-sm truncate">
                Watching: <span className="text-blue-300">{currentVideo.title}</span>
              </p>
            </div>
          </>
        ) : (
          /* Placeholder when nothing is selected */
          <div className="flex items-center justify-center bg-gray-900" style={{ paddingBottom: '56.25%', position: 'relative' }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Film size={48} className="text-gray-600" />
              <p className="mt-3 text-gray-400 text-sm">Tap a video below to start watching</p>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {videos.map((video, index) => (
            <button
              key={video.id}
              onClick={() => selectVideo(index)}
              className={`relative rounded-xl overflow-hidden aspect-video bg-gray-800 focus:outline-none transition-all ${
                currentIndex === index
                  ? 'ring-2 ring-blue-500 scale-[0.97]'
                  : 'hover:scale-[0.98] active:scale-95'
              }`}
              aria-label={`Play ${video.title}`}
            >
              {video.thumbnail_url ? (
                <Image
                  src={video.thumbnail_url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Film size={28} className="text-gray-600" />
                </div>
              )}
              {currentIndex === index && (
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
