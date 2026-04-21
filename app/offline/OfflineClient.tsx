'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { listCachedSets, type CachedSet } from '@/lib/offlineCache'

const noopSubscribe = () => () => undefined

function subscribeOnline(callback: () => void): () => void {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function formatTimeAgo(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function OfflineClient() {
  // useSyncExternalStore returns the server snapshot during SSR and the
  // client snapshot after hydration — no setState-in-effect gymnastics.
  const cached = useSyncExternalStore<CachedSet[] | null>(
    noopSubscribe,
    () => listCachedSets(),
    () => null
  )
  const online = useSyncExternalStore<boolean>(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  )

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex items-start gap-4">
        <div className="shrink-0 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 p-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">
            {online ? "Can't load this page" : "You're offline"}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {online
              ? "Live AI grading, sync, and new-set loading need a connection. In the meantime, you can study sets you've already viewed."
              : "No network. Pick a set below to keep studying offline."}
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${online ? 'bg-green-500' : 'bg-orange-500'}`} />
        <span className="text-xs text-[var(--muted)]">
          Network status: <span className="font-medium text-[var(--foreground)]">{online ? 'Online' : 'Offline'}</span>
        </span>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-[var(--muted)] uppercase tracking-wide">
        Recently studied ({cached?.length ?? 0})
      </h2>

      {cached === null && (
        <p className="text-sm text-[var(--muted)]">Loading cache…</p>
      )}

      {cached && cached.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--card)] p-6 text-center">
          <p className="text-sm text-[var(--muted)]">
            No cached sets yet. Open a set while you have a connection &mdash; it&apos;ll be available here the next time you go offline.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            Back to home
          </Link>
        </div>
      )}

      {cached && cached.length > 0 && (
        <ul className="flex flex-col gap-2">
          {cached.map(({ set, cards, cachedAt }) => (
            <li
              key={set.id}
              className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-semibold truncate">{set.title}</p>
                <p className="text-xs text-[var(--muted)] truncate">
                  {cards.length} card{cards.length === 1 ? '' : 's'} · cached {formatTimeAgo(cachedAt)}
                  {set.subject ? ` · ${set.subject}` : ''}
                </p>
              </div>
              <Link
                href={`/offline/study/${set.id}`}
                className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                Study offline
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
