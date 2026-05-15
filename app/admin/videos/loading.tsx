export default function VideosLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-24 rounded-lg bg-gray-200" />
      <div className="mt-2 h-4 w-96 rounded bg-gray-100" />

      {/* Search bar skeleton */}
      <div className="mt-6 flex gap-2">
        <div className="h-11 flex-1 rounded-xl bg-gray-100" />
        <div className="h-11 w-24 rounded-xl bg-gray-200" />
      </div>

      {/* Tab skeleton */}
      <div className="mt-8 flex gap-1 border-b border-gray-200 pb-px">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-t-lg bg-gray-100" />
        ))}
      </div>

      {/* Video card skeletons */}
      <div className="mt-3 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3">
            <div className="w-28 h-16 rounded-lg bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <div className="h-7 w-20 rounded-lg bg-gray-200" />
              <div className="h-7 w-20 rounded-lg bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
