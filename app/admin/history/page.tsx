import { createClient } from '@/lib/supabase/server'
import { Clock, CheckCircle2, XCircle } from 'lucide-react'

function formatWatched(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface HistoryRow {
  id: string
  watched_seconds: number
  completed: boolean
  created_at: string
  child_profile: { name: string } | null
  approved_videos: { title: string } | null
}

export default async function HistoryPage() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('watch_history')
    .select(`
      id,
      watched_seconds,
      completed,
      created_at,
      child_profile:child_profile_id ( name ),
      approved_videos:video_id ( title )
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = (data ?? []) as unknown as HistoryRow[]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Watch History</h1>
      <p className="mt-1 text-sm text-gray-500">
        Last {rows.length} viewing sessions
      </p>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Failed to load history: {error.message}
        </div>
      )}

      {rows.length === 0 && !error ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
          <Clock size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">No watch history yet</p>
          <p className="text-xs text-gray-400">History appears here once your child starts watching</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Child', 'Video', 'Date', 'Watched', 'Completed'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                    {row.child_profile?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                    {row.approved_videos?.title ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {formatWatched(row.watched_seconds)}
                  </td>
                  <td className="px-4 py-3">
                    {row.completed ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 size={15} /> Yes
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400">
                        <XCircle size={15} /> No
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
