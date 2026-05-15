export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-40 rounded-lg bg-gray-200" />
      <div className="mt-2 h-4 w-64 rounded bg-gray-100" />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-gray-100 p-5 h-24" />
        ))}
      </div>
    </div>
  )
}
