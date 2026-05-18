import { Shield, Play } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900">SafeTube</h1>
        <p className="mt-4 text-gray-600">Parent-controlled YouTube player</p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="/login"
            className="flex items-center justify-center gap-2 rounded-lg bg-teal-500 px-6 py-3 text-white font-bold hover:bg-teal-600 transition-colors"
          >
            <Shield size={20} />
            Parent Login
          </a>
          <a
            href="/watch"
            className="flex items-center justify-center gap-2 rounded-lg border border-teal-500 px-6 py-3 text-teal-600 bg-white font-semibold hover:bg-teal-50 transition-colors"
          >
            <Play size={20} fill="currentColor" />
            Child Player
          </a>
        </div>
      </div>
    </main>
  )
}
