import { Shield, Play } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-center px-6 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900">SafeTube</h1>
        <p className="mt-4 text-gray-600 text-lg">Parent-controlled YouTube player</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="/login"
            className="flex items-center gap-2 rounded-xl bg-teal-500 px-8 py-4 text-white font-semibold hover:bg-teal-600 transition-all shadow-sm"
          >
            <Shield size={20} />
            Parent Login
          </a>
          <a
            href="/watch"
            className="flex items-center gap-2 rounded-xl border border-teal-500 bg-white px-8 py-4 text-teal-600 font-normal hover:bg-teal-50 transition-all shadow-sm"
          >
            <Play size={20} fill="currentColor" />
            Child Player
          </a>
        </div>
      </div>
    </main>
  )
}
