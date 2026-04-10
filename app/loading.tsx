export default function DashboardLoading() {
  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:block w-56 shrink-0 border-r border-[var(--card-border)] bg-[var(--surface)] p-4">
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-[var(--surface-raised)]" />
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <div className="h-3 w-20 animate-pulse rounded bg-[var(--surface-raised)] mb-2" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-[var(--surface-raised)]" />
          ))}
        </div>
      </aside>

      {/* Main content skeleton */}
      <div className="flex-1 px-6 py-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-[var(--surface)]" />
          <div className="h-9 w-28 animate-pulse rounded-full bg-[var(--surface)]" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-[var(--surface)]" />
          ))}
        </div>
      </div>
    </div>
  )
}
