'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, Plus, Pencil, Trash2, X, Loader2, Tv, AlertTriangle } from 'lucide-react'
import type { ApprovedChannel, ApprovalMode } from '@/types/database'
import type { YoutubeSearchResult } from '@/app/api/admin/youtube-search/route'

// ── Constants ────────────────────────────────────────────────────────────────

const APPROVAL_OPTIONS: {
  value: ApprovalMode
  label: string
  description: string
  autoApproveNew: boolean
}[] = [
  {
    value: 'auto',
    label: 'Auto-approve new uploads',
    description: 'New videos from this channel are automatically added to the playlist',
    autoApproveNew: true,
  },
  {
    value: 'manual',
    label: 'Queue new uploads for review',
    description: 'New videos are held in your pending queue until you approve them',
    autoApproveNew: false,
  },
  {
    value: 'current_only',
    label: 'Current videos only (no sync)',
    description: 'No new videos are fetched — only videos you manually approve',
    autoApproveNew: false,
  },
]

const MODE_LABELS: Record<ApprovalMode, string> = {
  auto: 'Auto-approve',
  manual: 'Queue for review',
  current_only: 'Current only',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatSubscribers(count: string | undefined): string {
  if (!count || count === 'Hidden') return 'Subscribers hidden'
  const n = parseInt(count, 10)
  if (isNaN(n)) return count
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M subscribers`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K subscribers`
  return `${n} subscribers`
}

// ── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  channel: YoutubeSearchResult | { id: string; title: string; thumbnail: string | null }
  initialMode: ApprovalMode
  isEdit: boolean
  isSubmitting: boolean
  error: string | null
  onClose: () => void
  onSubmit: (mode: ApprovalMode, autoApproveNew: boolean) => void
}

function ChannelModal({
  channel,
  initialMode,
  isEdit,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: ModalProps) {
  const [mode, setMode] = useState<ApprovalMode>(initialMode)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const selected = APPROVAL_OPTIONS.find((o) => o.value === mode)!

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold text-gray-900">
          {isEdit ? 'Edit Channel' : 'Add Channel'}
        </h2>

        {/* Channel preview */}
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
          {channel.thumbnail ? (
            <Image
              src={channel.thumbnail}
              alt={channel.title}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <Tv size={20} className="text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{channel.title}</p>
          </div>
        </div>

        {/* Approval mode options */}
        <p className="mt-5 text-sm font-medium text-gray-700">Approval mode</p>
        <div className="mt-2 space-y-2">
          {APPROVAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-colors ${
                mode === opt.value
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="text-sm font-medium text-gray-900">{opt.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 rounded-lg bg-red-50 px-3 py-2">{error}</p>
        )}

        <button
          onClick={() => onSubmit(mode, selected.autoApproveNew)}
          disabled={isSubmitting}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-60 transition-colors"
        >
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {isEdit ? 'Save changes' : 'Add channel'}
        </button>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ChannelsClient({
  initialChannels,
}: {
  initialChannels: ApprovedChannel[]
}) {
  const router = useRouter()

  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YoutubeSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [quotaExceeded, setQuotaExceeded] = useState(false)

  // Modal state
  const [modal, setModal] = useState<{
    open: boolean
    searchResult: YoutubeSearchResult | null
    editingChannel: ApprovedChannel | null
  }>({ open: false, searchResult: null, editingChannel: null })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Removing state
  const [removingId, setRemovingId] = useState<string | null>(null)

  const approvedIds = new Set(initialChannels.map((ch) => ch.youtube_channel_id))

  // ── Search ──────────────────────────────────────────────────────────────

  const handleSearch = useCallback(async (e: React.FormEvent) => {
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
        body: JSON.stringify({ query: query.trim(), type: 'channel' }),
      })
      const data = await res.json() as { results?: YoutubeSearchResult[]; error?: string; quota_exceeded?: boolean }
      if (!res.ok) {
        setQuotaExceeded(data.quota_exceeded ?? false)
        setSearchError(data.error ?? 'Search failed')
      } else {
        setResults(data.results ?? [])
        if ((data.results ?? []).length === 0) setSearchError('No channels found')
      }
    } catch {
      setSearchError('Network error — please try again')
    } finally {
      setIsSearching(false)
    }
  }, [query])

  // ── Modal helpers ───────────────────────────────────────────────────────

  function openAddModal(result: YoutubeSearchResult) {
    setModal({ open: true, searchResult: result, editingChannel: null })
    setModalError(null)
  }

  function openEditModal(ch: ApprovedChannel) {
    setModal({ open: true, searchResult: null, editingChannel: ch })
    setModalError(null)
  }

  function closeModal() {
    setModal({ open: false, searchResult: null, editingChannel: null })
    setModalError(null)
  }

  // ── Add / Edit submit ───────────────────────────────────────────────────

  async function handleSubmit(mode: ApprovalMode, autoApproveNew: boolean) {
    setIsSubmitting(true)
    setModalError(null)

    try {
      if (modal.editingChannel) {
        // Edit existing channel
        const res = await fetch(`/api/admin/channels/${modal.editingChannel.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approval_mode: mode, auto_approve_new: autoApproveNew }),
        })
        const data = await res.json()
        if (!res.ok) {
          setModalError(data.error ?? 'Failed to update channel')
          return
        }
      } else if (modal.searchResult) {
        // Add new channel
        const ch = modal.searchResult
        const res = await fetch('/api/admin/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            youtube_channel_id: ch.id,
            channel_title: ch.title,
            thumbnail_url: ch.thumbnail,
            approval_mode: mode,
            auto_approve_new: autoApproveNew,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setModalError(data.error ?? 'Failed to add channel')
          return
        }
      }
      closeModal()
      router.refresh()
    } catch {
      setModalError('Network error — please try again')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Remove ──────────────────────────────────────────────────────────────

  async function handleRemove(id: string) {
    if (!confirm('Remove this channel? Approved videos will remain but no new videos will sync.')) return
    setRemovingId(id)
    try {
      await fetch(`/api/admin/channels/${id}`, { method: 'DELETE' })
      router.refresh()
    } catch {
      // silent — user can retry
    } finally {
      setRemovingId(null)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  const modalChannel = modal.searchResult
    ? { id: modal.searchResult.id, title: modal.searchResult.title, thumbnail: modal.searchResult.thumbnail }
    : modal.editingChannel
    ? { id: modal.editingChannel.id, title: modal.editingChannel.channel_title, thumbnail: modal.editingChannel.thumbnail_url }
    : null

  const modalInitialMode: ApprovalMode = modal.editingChannel?.approval_mode ?? 'manual'

  return (
    <>
      {modal.open && modalChannel && (
        <ChannelModal
          channel={modalChannel}
          initialMode={modalInitialMode}
          isEdit={!!modal.editingChannel}
          isSubmitting={isSubmitting}
          error={modalError}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Channels</h1>
        <p className="mt-1 text-sm text-gray-500">
          Search for YouTube channels and control how their videos are approved.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search YouTube channels…"
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
            {isSearching ? <Loader2 size={15} className="animate-spin" /> : null}
            Search
          </button>
        </form>

        {/* Search error */}
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
            {results.map((ch) => {
              const alreadyAdded = approvedIds.has(ch.id)
              return (
                <div
                  key={ch.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3"
                >
                  {ch.thumbnail ? (
                    <Image
                      src={ch.thumbnail}
                      alt={ch.title}
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Tv size={18} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ch.title}</p>
                    <p className="text-xs text-gray-500">{formatSubscribers(ch.subscriberCount)}</p>
                  </div>
                  <button
                    onClick={() => openAddModal(ch)}
                    disabled={alreadyAdded}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors flex-shrink-0 ${
                      alreadyAdded
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-teal-500 text-white hover:bg-teal-600'
                    }`}
                  >
                    <Plus size={13} />
                    {alreadyAdded ? 'Added' : 'Add'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Approved channels list */}
        <div className="mt-8">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Approved channels ({initialChannels.length})
          </p>

          {initialChannels.length === 0 ? (
            <div className="mt-3 rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
              <Tv size={32} className="mx-auto text-gray-300" />
              <p className="mt-2 text-sm font-medium text-gray-500">No channels added yet</p>
              <p className="text-xs text-gray-400">Search above to add your first channel</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {initialChannels.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3"
                >
                  {ch.thumbnail_url ? (
                    <Image
                      src={ch.thumbnail_url}
                      alt={ch.channel_title}
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Tv size={18} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ch.channel_title}</p>
                    <p className="text-xs text-gray-500">{MODE_LABELS[ch.approval_mode]}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(ch)}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleRemove(ch.id)}
                      disabled={removingId === ch.id}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      aria-label="Remove"
                    >
                      {removingId === ch.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
