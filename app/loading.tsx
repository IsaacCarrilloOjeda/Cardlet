export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Stats skeleton */}
      <div className="mb-8 flex gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-20 w-32 animate-pulse rounded-xl bg-[var(--card)]" />
        ))}
      </div>

      {/* Toolbar skeleton */}
      <div className="mb-6 flex gap-3">
        <div className="h-10 flex-1 animate-pulse rounded-lg bg-[var(--card)]" />
        <div className="h-10 w-28 animate-pulse rounded-lg bg-[var(--card)]" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-[var(--card)]" />
        ))}
      </div>
    </div>
  )
}
