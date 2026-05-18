'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, Check, X, Trash2, Loader2, Film, Clock, AlertTriangle } from 'lucide-react'
import type { ApprovedVideo, ApprovalStatus } from '@/types/database'
import type { YoutubeSearchResult } from '@/app/api/admin/youtube-search/route'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(iso: string | null | undefined): string {
  if (!iso) return ''
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return ''
  const h = parseInt(m[1] ?? '0', 10)
  const min = parseInt(m[2] ?? '0', 10)
  const s = parseInt(m[3] ?? '0', 10)
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${min}:${String(s).padStart(2, '0')}`
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const STATUS_BADGE: Record<ApprovalStatus, string> = {
  approved: 'bg-green-100 text-green-700',
  pending:  'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
}

const TAB_LABELS: { key: ApprovalStatus | 'all'; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'approved', label: 'Approved' },
  { key: 'pending',  label: 'Pending'  },
  { key: 'rejected', label: 'Rejected' },
]

// ── Video card (list item) ────────────────────────────────────────────────────

function VideoCard({
  video,
  showStatus,
  processingId,
  onApprove,
  onReject,
  onDelete,
}: {
  video: ApprovedVideo
  showStatus: boolean
  processingId: string | null
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onDelete: (id: string) => void
}) {
  const busy = processingId === video.id

  return (
    <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-3">
      {video.thumbnail_url ? (
        <Image
          src={video.thumbnail_url}
          alt={video.title}
          width={120}
          height={68}
          className="w-28 h-16 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-28 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Film size={20} className="text-gray-300" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{video.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {video.channel_name && (
            <span className="text-xs text-gray-500 truncate">{video.channel_name}</span>
          )}
          {video.duration && (
            <span className="flex items-center gap-0.5 text-xs text-gray-400">
              <Clock size={10} />
              {formatDuration(video.duration)}
            </span>
          )}
          {video.published_at && (
            <span className="text-xs text-gray-400">{formatDate(video.published_at)}</span>
          )}
        </div>
        {showStatus && (
          <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[video.approval_status]}`}>
            {video.approval_status}
          </span>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {video.approval_status !== 'approved' && (
          <button
            onClick={() => onApprove(video.id)}
            disabled={busy}
            className="flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            aria-label="Approve"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Approve
          </button>
        )}
        {video.approval_status !== 'rejected' && (
          <button
            onClick={() => onReject(video.id)}
            disabled={busy}
            className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
            aria-label="Reject"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
            Reject
          </button>
        )}
        <button
          onClick={() => onDelete(video.id)}
          disabled={busy}
          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
          aria-label="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VideosClient({ initialVideos }: { initialVideos: ApprovedVideo[] }) {
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YoutubeSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [quotaExceeded, setQuotaExceeded] = useState(false)

  const [activeTab, setActiveTab] = useState<ApprovalStatus | 'all'>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [approvingSearchId, setApprovingSearchId] = useState<string | null>(null)

  const approvedYtIds = useMemo(
    () => new Map(initialVideos.map((v) => [v.youtube_video_id, v])),
    [initialVideos]
  )

  const counts = useMemo(
    () => ({
      all:      initialVideos.length,
      approved: initialVideos.filter((v) => v.approval_status === 'approved').length,
      pending:  initialVideos.filter((v) => v.approval_status === 'pending').length,
      rejected: initialVideos.filter((v) => v.approval_status === 'rejected').length,
    }),
    [initialVideos]
  )

  const filteredVideos = useMemo(
    () =>
      activeTab === 'all'
        ? initialVideos
        : initialVideos.filter((v) => v.approval_status === activeTab),
    [initialVideos, activeTab]
  )

  // ── Search ────────────────────────────────────────────────────────────────

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!query.trim()) return
      setIsSearching(true)
      setSearchError(null)
      setQuotaExceeded(false)
      setResults([])
      try {
        const res = await fetch('/api/admin/youtube-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: query.trim(), type: 'video' }),
        })
        const data = await res.json() as { results?: YoutubeSearchResult[]; error?: string; quota_exceeded?: boolean }
        if (!res.ok) {
          setQuotaExceeded(data.quota_exceeded ?? false)
          setSearchError(data.error ?? 'Search failed')
        } else {
          setResults(data.results ?? [])
          if ((data.results ?? []).length === 0) setSearchError('No videos found')
        }
      } catch {
        setSearchError('Network error — please try again')
      } finally {
        setIsSearching(false)
      }
    },
    [query]
  )

  // ── Approve from search ───────────────────────────────────────────────────

  async function handleApproveFromSearch(video: YoutubeSearchResult) {
    setApprovingSearchId(video.id)
    try {
      await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtube_video_id: video.id,
          title: video.title,
          thumbnail_url: video.thumbnail,
          channel_id: null,
          channel_name: video.channelName,
          duration: video.duration,
          published_at: video.publishedAt,
        }),
      })
      router.refresh()
    } catch {
      // silent
    } finally {
      setApprovingSearchId(null)
    }
  }

  // ── Approve / Reject / Delete ─────────────────────────────────────────────

  async function patchStatus(id: string, status: ApprovalStatus) {
    setProcessingId(id)
    try {
      await fetch(`/api/admin/videos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_status: status }),
      })
      router.refresh()
    } catch {
      // silent
    } finally {
      setProcessingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Permanently remove this video from SafeTube?')) return
    setProcessingId(id)
    try {
      await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' })
      router.refresh()
    } catch {
      // silent
    } finally {
      setProcessingId(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Videos</h1>
      <p className="mt-1 text-sm text-gray-500">
        Search for videos to approve, or review videos queued from channel syncs.
      </p>

      {/* Search */}
      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search YouTube videos…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-300 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-60 transition-colors"
        >
          {isSearching && <Loader2 size={15} className="animate-spin" />}
          Search
        </button>
      </form>

      {searchError && (
        quotaExceeded ? (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">{searchError}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-red-600">{searchError}</p>
        )
      )}

      {/* Search results */}
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Search results
          </p>
          {results.map((v) => {
            const existing = approvedYtIds.get(v.id)
            const isApproved = existing?.approval_status === 'approved'
            const busy = approvingSearchId === v.id

            return (
              <div
                key={v.id}
                className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3"
              >
                {v.thumbnail ? (
                  <Image
                    src={v.thumbnail}
                    alt={v.title}
                    width={120}
                    height={68}
                    className="w-28 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-28 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Film size={20} className="text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                    {v.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-xs text-gray-500 truncate">{v.channelName}</span>
                    {v.duration && (
                      <span className="flex items-center gap-0.5 text-xs text-gray-400">
                        <Clock size={10} />
                        {formatDuration(v.duration)}
                      </span>
                    )}
                    {v.publishedAt && (
                      <span className="text-xs text-gray-400">{formatDate(v.publishedAt)}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleApproveFromSearch(v)}
                  disabled={isApproved || busy}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold flex-shrink-0 transition-colors ${
                    isApproved
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {busy ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Check size={12} />
                  )}
                  {isApproved ? 'Approved' : 'Approve'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Filter tabs + video list */}
      <div className="mt-8">
        <div className="flex gap-1 border-b border-gray-200">
          {TAB_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === key
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                activeTab === key ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {filteredVideos.length === 0 ? (
          <div className="mt-6 rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
            <Film size={32} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm font-medium text-gray-500">
              {activeTab === 'pending' ? 'No videos pending review' : 'No videos here yet'}
            </p>
            {activeTab === 'all' && (
              <p className="text-xs text-gray-400">Search above to approve your first video</p>
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                showStatus={activeTab === 'all'}
                processingId={processingId}
                onApprove={(id) => patchStatus(id, 'approved')}
                onReject={(id) => patchStatus(id, 'rejected')}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
