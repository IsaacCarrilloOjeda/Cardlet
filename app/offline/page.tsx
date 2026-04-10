export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-5xl">📡</div>
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Cardlet needs an internet connection for live AI grading, syncing, and loading new sets.
        Reconnect and try again.
      </p>
    </div>
  )
}
