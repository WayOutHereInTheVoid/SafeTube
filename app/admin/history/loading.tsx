export default function HistoryLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-36 rounded-lg bg-gray-200" />
      <div className="mt-2 h-4 w-48 rounded bg-gray-100" />

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Table header */}
        <div className="flex gap-4 border-b border-gray-100 bg-gray-50 px-4 py-3">
          {[80, 200, 120, 80, 80].map((w, i) => (
            <div key={i} className={`h-3 rounded bg-gray-200`} style={{ width: w }} />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-gray-50 px-4 py-3 last:border-0">
            <div className="h-4 w-20 rounded bg-gray-100" />
            <div className="h-4 w-48 rounded bg-gray-100" />
            <div className="h-4 w-28 rounded bg-gray-100" />
            <div className="h-4 w-16 rounded bg-gray-100" />
            <div className="h-4 w-16 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}
