import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Tv, Play, AlertCircle, Clock } from 'lucide-react'

const COLOR_CLASSES = {
  blue:   { card: 'bg-blue-50',   icon: 'text-blue-600',   value: 'text-blue-700'  },
  green:  { card: 'bg-green-50',  icon: 'text-green-600',  value: 'text-green-700' },
  amber:  { card: 'bg-amber-50',  icon: 'text-amber-600',  value: 'text-amber-700' },
  purple: { card: 'bg-purple-50', icon: 'text-purple-600', value: 'text-purple-700'},
  gray:   { card: 'bg-gray-50',   icon: 'text-gray-400',   value: 'text-gray-600'  },
} as const

type ColorKey = keyof typeof COLOR_CLASSES

/**
 * The admin dashboard page.
 * Displays summary statistics and status alerts for the parent.
 *
 * @returns A dashboard page component with statistics cards.
 */
export default async function DashboardPage() {
  const supabase = createClient()

  const [channelsRes, approvedRes, pendingRes, historyRes] = await Promise.all([
    supabase.from('approved_channels').select('*', { count: 'exact', head: true }),
    supabase
      .from('approved_videos')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'approved'),
    supabase
      .from('approved_videos')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending'),
    supabase.from('watch_history').select('*', { count: 'exact', head: true }),
  ])

  const pendingCount = pendingRes.count ?? 0

  const stats: {
    label: string
    value: number
    icon: React.ElementType
    href: string
    color: ColorKey
  }[] = [
    {
      label: 'Approved Channels',
      value: channelsRes.count ?? 0,
      icon: Tv,
      href: '/admin/channels',
      color: 'blue',
    },
    {
      label: 'Approved Videos',
      value: approvedRes.count ?? 0,
      icon: Play,
      href: '/admin/videos',
      color: 'green',
    },
    {
      label: 'Pending Review',
      value: pendingCount,
      icon: AlertCircle,
      href: '/admin/videos',
      color: pendingCount > 0 ? 'amber' : 'gray',
    },
    {
      label: 'Videos Watched',
      value: historyRes.count ?? 0,
      icon: Clock,
      href: '/admin/history',
      color: 'purple',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Overview of your SafeTube content</p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, href, color }) => {
          const c = COLOR_CLASSES[color]
          return (
            <Link
              key={label}
              href={href}
              className={`${c.card} rounded-xl p-5 flex items-start gap-4 hover:brightness-95 transition-all`}
            >
              <div className={`${c.icon} mt-0.5`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <p className={`text-3xl font-bold mt-1 ${c.value}`}>{value}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {pendingCount > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-center gap-3">
          <AlertCircle className="text-amber-500 flex-shrink-0" size={18} />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{pendingCount} video{pendingCount !== 1 ? 's' : ''}</span>{' '}
            waiting for your review.{' '}
            <Link href="/admin/videos" className="underline font-medium">
              Review now
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
