'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'

interface SyncResult {
  synced: number
  total_added: number
  total_rejected: number
}

type Status = 'idle' | 'syncing' | 'success' | 'error'

export default function SyncButton() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<SyncResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSync() {
    setStatus('syncing')
    setResult(null)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/admin/sync', { method: 'POST' })
      const data = await res.json() as SyncResult & { error?: string }

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Sync failed')
        setStatus('error')
        return
      }

      setResult(data)
      setStatus('success')
      router.refresh()

      // Reset to idle after 6 seconds
      setTimeout(() => setStatus('idle'), 6000)
    } catch {
      setErrorMsg('Network error — please try again')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  if (status === 'success' && result) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
        <CheckCircle2 size={15} className="flex-shrink-0" />
        <span>
          Synced {result.synced} channel{result.synced !== 1 ? 's' : ''} — {result.total_added} added
          {result.total_rejected > 0 && `, ${result.total_rejected} removed`}
        </span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
        <AlertCircle size={15} className="flex-shrink-0" />
        <span>{errorMsg}</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleSync}
      disabled={status === 'syncing'}
      className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
    >
      <RefreshCw size={14} className={status === 'syncing' ? 'animate-spin' : ''} />
      {status === 'syncing' ? 'Syncing…' : 'Sync Now'}
    </button>
  )
}
