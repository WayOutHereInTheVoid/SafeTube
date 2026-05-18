export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-gray-900">SafeTube</h1>
      <p className="mt-4 text-gray-600">Parent-controlled YouTube player</p>
      <div className="mt-8 flex gap-4">
        <a
          href="/login"
          className="rounded-lg bg-teal-500 px-6 py-3 text-white font-semibold hover:bg-teal-600 transition-colors"
        >
          Parent Login
        </a>
        <a
          href="/watch"
          className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          Child Player
        </a>
      </div>
    </main>
  )
}
