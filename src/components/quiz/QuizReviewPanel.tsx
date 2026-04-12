'use client'

import { useEffect, useState } from 'react'

export interface WrongCardLog {
  id: string
  front: string
  back: string
  userAnswer?: string
}

interface ReviewGroup {
  topic: string
  cardIndices: number[]
  explanation: string
}

interface Props {
  wrongCards: WrongCardLog[]
}

export function QuizReviewPanel({ wrongCards }: Props) {
  const [groups, setGroups] = useState<ReviewGroup[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (wrongCards.length === 0) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch('/api/ai/post-quiz-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wrong: wrongCards.map((c) => ({ front: c.front, back: c.back, userAnswer: c.userAnswer })),
      }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (cancelled) return
        setGroups(Array.isArray(data.groups) ? data.groups : [])
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load review')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [wrongCards])

  if (wrongCards.length === 0) return null

  return (
    <div className="mt-8 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5">
      <div className="flex items-center gap-2 mb-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h2 className="text-base font-semibold">Review your mistakes</h2>
        <span className="ml-auto rounded-full bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
          AI
        </span>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--card-border)]" />
          <div className="h-12 animate-pulse rounded bg-[var(--card-border)]" />
          <div className="h-12 animate-pulse rounded bg-[var(--card-border)]" />
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-red-400">Couldn&apos;t load the review: {error}</p>
      )}

      {!loading && !error && groups && groups.length === 0 && (
        <p className="text-sm text-[var(--muted)]">No grouped concepts to show.</p>
      )}

      {!loading && !error && groups && groups.length > 0 && (
        <div className="flex flex-col gap-4">
          {groups.map((g, gi) => (
            <div key={gi} className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-semibold text-sm text-[var(--foreground)]">{g.topic}</p>
                <span className="shrink-0 rounded-full bg-red-500/10 text-red-400 px-2 py-0.5 text-[10px] font-bold">
                  {g.cardIndices.length} {g.cardIndices.length === 1 ? 'card' : 'cards'}
                </span>
              </div>
              <p className="text-sm text-[var(--muted)] mb-3 leading-relaxed">{g.explanation}</p>
              <ul className="flex flex-col gap-1.5">
                {g.cardIndices
                  .map((i) => wrongCards[i])
                  .filter(Boolean)
                  .map((c, ci) => (
                    <li key={ci} className="text-xs flex gap-2">
                      <span className="text-[var(--muted)] shrink-0">•</span>
                      <span className="text-[var(--muted)]">
                        <span className="text-[var(--foreground)]">{c.front}</span>
                        {' → '}
                        <span className="text-green-400">{c.back}</span>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          <p className="text-[10px] text-[var(--muted)] text-center">⚠️ AI can make mistakes. Review carefully.</p>
        </div>
      )}
    </div>
  )
}
