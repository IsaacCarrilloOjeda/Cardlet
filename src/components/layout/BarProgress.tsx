'use client'

import Link from 'next/link'
import { useCredits, TUTOR_FULL_COST, TUTOR_HALF_COST, WRITTEN_GRADING_COST, CARD_GEN_COST } from './CreditsContext'

interface Props {
  /** If true, renders more compact (for use inside quiz mode footer) */
  compact?: boolean
}

export function BarProgress({ compact }: Props) {
  const { credits, totalCredits } = useCredits()

  const used = totalCredits - credits
  const fraction = totalCredits > 0 ? used / totalCredits : 0

  function barColor(frac: number) {
    if (frac < 0.6) return 'var(--accent)'
    if (frac < 0.85) return '#f59e0b'
    return '#ef4444'
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 px-1">
        <div className="flex flex-col gap-0.5 flex-1">
          <div className="flex justify-between text-[10px] text-[var(--muted)]">
            <span>AI Credits</span>
            <span>{credits}/{totalCredits}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[var(--card-border)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${fraction * 100}%`, background: barColor(fraction) }}
            />
          </div>
        </div>

        <Link
          href="/credits"
          title="Get more credits"
          className="flex-shrink-0 w-6 h-6 rounded-full border border-[var(--accent)] text-[var(--accent)] flex items-center justify-center text-sm font-bold hover:bg-[var(--accent)] hover:text-white transition-colors"
        >
          +
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">AI Credits</p>
        <Link
          href="/credits"
          title="Get more credits"
          className="flex items-center gap-1 rounded-full border border-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors"
        >
          <span className="text-base leading-none">+</span> Get Credits
        </Link>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--muted)]">Remaining</span>
          <span className="font-medium tabular-nums">{credits} <span className="text-[var(--muted)] font-normal">/ {totalCredits}</span></span>
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--card-border)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${fraction * 100}%`, background: barColor(fraction) }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-[var(--muted)]">
        <span>AI Tutor (full) — {TUTOR_FULL_COST} credits</span>
        <span>AI Tutor (half) — {TUTOR_HALF_COST} credits</span>
        <span>Written grading — {WRITTEN_GRADING_COST} credit</span>
        <span>Card generation — {CARD_GEN_COST} credit/card</span>
      </div>
    </div>
  )
}
