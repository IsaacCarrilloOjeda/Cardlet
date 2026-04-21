'use client'

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { getCachedSet } from '@/lib/offlineCache'
import type { Card, StudySet } from '@/types'

interface Props {
  setId: string
}

// Never-changes subscription so useSyncExternalStore just reads the snapshot
// once per mount — the snapshot differs between server (null) and client
// (localStorage-backed), which is exactly what we want here.
const noopSubscribe = () => () => undefined

export function OfflineStudyClient({ setId }: Props) {
  const data = useSyncExternalStore<{ set: StudySet; cards: Card[] } | null>(
    noopSubscribe,
    () => {
      const cached = getCachedSet(setId)
      return cached ? { set: cached.set, cards: cached.cards } : null
    },
    () => null
  )
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [stats, setStats] = useState({ right: 0, wrong: 0 })
  const [done, setDone] = useState(false)

  const card = data?.cards[index]
  const total = data?.cards.length ?? 0

  const progress = useMemo(() => {
    if (!total) return 0
    return Math.round(((index + (done ? 1 : 0)) / total) * 100)
  }, [index, total, done])

  const mark = useCallback(
    (correct: boolean) => {
      if (!card || !data) return
      setStats((s) => ({
        right: s.right + (correct ? 1 : 0),
        wrong: s.wrong + (correct ? 0 : 1),
      }))
      if (index + 1 >= data.cards.length) {
        setDone(true)
      } else {
        setIndex(index + 1)
        setFlipped(false)
      }
    },
    [card, data, index]
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done || !card) return
      if (e.key === ' ') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (flipped && (e.key === '1' || e.key.toLowerCase() === 'x')) {
        mark(false)
      } else if (flipped && (e.key === '2' || e.key.toLowerCase() === 'c')) {
        mark(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, card, flipped, mark])

  function restart() {
    setIndex(0)
    setFlipped(false)
    setStats({ right: 0, wrong: 0 })
    setDone(false)
  }

  if (!data || data.cards.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">No offline copy of this set</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Open it once while online and it&apos;ll be cached automatically.
        </p>
        <Link
          href="/offline"
          className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          Back to offline library
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Offline banner */}
      <div className="mb-4 rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-xs text-orange-300 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
        Offline mode &mdash; studying from cache. Progress won&apos;t sync to spaced repetition.
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/offline"
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Offline library
        </Link>
        <h1 className="text-sm font-semibold truncate">{data.set.title}</h1>
        <span className="text-xs text-[var(--muted)] shrink-0">{index + 1} / {total}</span>
      </div>

      {/* Progress */}
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-[var(--card-border)]">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {done ? (
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center">
          <h2 className="text-xl font-bold">Done!</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {stats.right} correct · {stats.wrong} missed
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              onClick={restart}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              Study again
            </button>
            <Link
              href="/offline"
              className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium"
            >
              Back
            </Link>
          </div>
        </div>
      ) : card ? (
        <>
          <button
            onClick={() => setFlipped((f) => !f)}
            className="block w-full rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center min-h-[240px] flex items-center justify-center text-lg transition-colors hover:border-[var(--accent)]"
          >
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                {flipped ? 'Back' : 'Front'}
              </div>
              <div className="whitespace-pre-wrap">{flipped ? card.back : card.front}</div>
            </div>
          </button>

          {flipped ? (
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => mark(false)}
                className="rounded-lg border border-red-500/40 bg-red-500/10 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20"
              >
                Missed (1)
              </button>
              <button
                onClick={() => mark(true)}
                className="rounded-lg border border-green-500/40 bg-green-500/10 py-2 text-sm font-medium text-green-300 hover:bg-green-500/20"
              >
                Got it (2)
              </button>
            </div>
          ) : (
            <p className="mt-4 text-center text-xs text-[var(--muted)]">
              Space or click to flip
            </p>
          )}
        </>
      ) : null}
    </div>
  )
}
