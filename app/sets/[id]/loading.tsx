export default function SetDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 h-40 animate-pulse rounded-2xl bg-[var(--card)]" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--card)]" />
        ))}
      </div>
    </div>
  )
}
