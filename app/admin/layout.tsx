import { LogOut } from 'lucide-react'
import { logout } from './actions'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-gray-900 text-lg">SafeTube</span>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </form>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
