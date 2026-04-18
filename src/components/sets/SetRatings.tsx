'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { rateSetAction } from '@/lib/actions'
import type { SetRating } from '@/types'

interface Props {
  ratings: SetRating[]
  setId: string
  currentUserId?: string
}

function StarPicker({ value, onChange, readonly }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= (hover || value)
        return (
          <button
            key={n}
            type="button"
            disabled={readonly}
            onMouseEnter={() => !readonly && setHover(n)}
            onClick={() => onChange?.(n)}
            className={`transition-transform ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={filled ? 'var(--accent)' : 'none'}
              stroke={filled ? 'var(--accent)' : 'var(--card-border)'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}

export function StarDisplay({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value)
        return (
          <svg
            key={n}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? 'var(--accent)' : 'none'}
            stroke={filled ? 'var(--accent)' : 'var(--card-border)'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )
      })}
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function SetRatings({ ratings, setId, currentUserId }: Props) {
  const existingRating = currentUserId
    ? ratings.find((r) => r.user_id === currentUserId)
    : null

  const [stars, setStars] = useState(existingRating?.stars ?? 0)
  const [comment, setComment] = useState(existingRating?.comment ?? '')
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (stars === 0 || !currentUserId) return
    startTransition(async () => {
      await rateSetAction(setId, stars, comment.trim() || null)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    })
  }

  const avgStars = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
    : 0

  return (
    <div className="mt-8 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Ratings & Reviews</h3>
        {ratings.length > 0 && (
          <div className="flex items-center gap-2">
            <StarDisplay value={avgStars} size={14} />
            <span className="text-xs text-[var(--muted)]">
              {avgStars.toFixed(1)} ({ratings.length})
            </span>
          </div>
        )}
      </div>

      {/* Rate form */}
      {currentUserId && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--muted)]">Your rating:</span>
            <StarPicker value={stars} onChange={setStars} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a review (optional)"
            rows={2}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-sm resize-none focus:border-[var(--accent)] focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={stars === 0 || isPending}
              className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-xs font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Saving...' : existingRating ? 'Update Review' : 'Submit Review'}
            </button>
            {submitted && (
              <span className="text-xs text-green-400">Saved!</span>
            )}
          </div>
        </form>
      )}

      {/* Ratings list */}
      {ratings.length === 0 ? (
        <p className="text-sm text-[var(--muted)] text-center py-4">No reviews yet. Be the first!</p>
      ) : (
        <div className="flex flex-col gap-3">
          {ratings.map((r) => (
            <div key={r.id} className="flex gap-3 py-3 border-t border-[var(--card-border)] first:border-t-0 first:pt-0">
              <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--background)] border border-[var(--card-border)] overflow-hidden flex items-center justify-center">
                {r.avatar_url ? (
                  <Image src={r.avatar_url} alt="" width={32} height={32} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <span className="text-xs font-bold text-[var(--muted)]">
                    {(r.username ?? '?')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium truncate">{r.username ?? 'Anonymous'}</span>
                  <StarDisplay value={r.stars} size={12} />
                  <span className="text-[10px] text-[var(--muted)]">{formatDate(r.created_at)}</span>
                </div>
                {r.comment && <p className="text-sm text-[var(--muted)]">{r.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
