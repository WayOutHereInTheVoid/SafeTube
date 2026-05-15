'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Tv,
  Play,
  History,
  Settings,
  Menu,
  LogOut,
  Shield,
} from 'lucide-react'
import { logout } from '@/app/admin/actions'

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/channels', label: 'Channels', icon: Tv },
  { href: '/admin/videos', label: 'Videos', icon: Play },
  { href: '/admin/history', label: 'Watch History', icon: History },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon size={17} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarHeader({ childName }: { childName: string | null }) {
  return (
    <div className="px-6 py-5 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <Shield className="text-blue-600" size={20} />
        <span className="font-bold text-gray-900">SafeTube</span>
      </div>
      {childName ? (
        <p className="mt-1 text-xs text-gray-500">Child: {childName}</p>
      ) : (
        <p className="mt-1 text-xs text-amber-600">No child profile — set up in Settings</p>
      )}
    </div>
  )
}

function SignOutButton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <form action={logout}>
        <button
          type="submit"
          className="p-1 text-gray-500 hover:text-gray-900 transition-colors"
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </form>
    )
  }
  return (
    <div className="px-3 py-4 border-t border-gray-200">
      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </form>
    </div>
  )
}

export default function AdminShell({
  children,
  childName,
}: {
  children: React.ReactNode
  childName: string | null
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-60 flex-col flex-shrink-0 border-r border-gray-200 bg-white">
        <SidebarHeader childName={childName} />
        <NavLinks pathname={pathname} />
        <SignOutButton />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-60 flex flex-col bg-white border-r border-gray-200 z-50">
            <SidebarHeader childName={childName} />
            <NavLinks pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
            <SignOutButton />
          </aside>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex lg:hidden items-center justify-between border-b border-gray-200 bg-white px-4 py-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1.5">
            <Shield className="text-blue-600" size={18} />
            <span className="font-bold text-gray-900">SafeTube</span>
          </div>
          <SignOutButton compact />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
