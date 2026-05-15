export default function ChannelsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-32 rounded-lg bg-gray-200" />
      <div className="mt-2 h-4 w-80 rounded bg-gray-100" />

      {/* Search bar skeleton */}
      <div className="mt-6 flex gap-2">
        <div className="h-11 flex-1 rounded-xl bg-gray-100" />
        <div className="h-11 w-24 rounded-xl bg-gray-200" />
      </div>

      {/* Channel list skeleton */}
      <div className="mt-8">
        <div className="h-3 w-40 rounded bg-gray-200" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
              <div className="w-11 h-11 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-48 rounded bg-gray-200" />
                <div className="h-3 w-28 rounded bg-gray-100" />
              </div>
              <div className="flex gap-1">
                <div className="h-8 w-8 rounded-lg bg-gray-100" />
                <div className="h-8 w-8 rounded-lg bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
