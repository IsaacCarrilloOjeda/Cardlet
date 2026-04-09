'use client'

import { useState } from 'react'
import { useCredits, TUTOR_FULL_COST, TUTOR_HALF_COST, WRITTEN_GRADING_COST, CARD_GEN_COST } from './CreditsContext'

const R = 30
const CX = 40
const CY = 40
const CIRCUMFERENCE = 2 * Math.PI * R

export function CircleProgress() {
  const { credits, totalCredits, addCredits } = useCredits()
  const [expanded, setExpanded] = useState(false)

  const used = totalCredits - credits
  const fraction = totalCredits > 0 ? Math.min(used / totalCredits, 1) : 0

  const snakeLength = CIRCUMFERENCE * fraction
  const offset = CIRCUMFERENCE - snakeLength

  function snakeColor() {
    if (fraction < 0.6) return 'var(--accent)'
    if (fraction < 0.85) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="fixed left-4 z-40" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}>
      <div className="relative flex flex-col items-center gap-2">
        {/* Expanded tooltip */}
        {expanded && (
          <div className="absolute bottom-[88px] left-0 w-56 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-3 shadow-xl text-xs flex flex-col gap-2">
            <p className="font-semibold text-sm">AI Credits</p>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Remaining</span>
              <span className="font-medium">{credits}/{totalCredits}</span>
            </div>
            <div className="border-t border-[var(--card-border)] pt-2 flex flex-col gap-1 text-[10px] text-[var(--muted)]">
              <span>✨ Tutor (full) — {TUTOR_FULL_COST} credits</span>
              <span>⚡ Tutor (half) — {TUTOR_HALF_COST} credits</span>
              <span>📝 Written grading — {WRITTEN_GRADING_COST} credit</span>
              <span>🃏 Card gen — {CARD_GEN_COST} credit/card</span>
            </div>
            <button
              onClick={() => { addCredits(); setExpanded(false) }}
              className="mt-1 w-full rounded-lg bg-[var(--accent)] py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
              + Add 100 credits
            </button>
          </div>
        )}

        {/* Circle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          title="AI credits remaining"
          className="relative flex items-center justify-center rounded-full bg-[var(--card)] border border-[var(--card-border)] shadow-lg hover:border-[var(--accent)] transition-colors"
          style={{ width: 72, height: 72 }}
        >
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ position: 'absolute', top: -4, left: -4 }}>
            {/* Track */}
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke="var(--card-border)"
              strokeWidth="5"
            />
            {/* Snake arc — grows from top (12 o'clock), clockwise */}
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={snakeColor()}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${snakeLength} ${CIRCUMFERENCE}`}
              strokeDashoffset={CIRCUMFERENCE * 0.25}
              style={{ transform: 'rotate(-90deg)', transformOrigin: `${CX}px ${CY}px`, transition: 'stroke-dasharray 0.6s ease' }}
            />
          </svg>

          {/* Inner content */}
          <div className="flex flex-col items-center leading-none z-10">
            <span className="text-xs font-bold tabular-nums" style={{ color: snakeColor() }}>{credits}</span>
            <span className="text-[9px] text-[var(--muted)]">credits</span>
          </div>

          {/* + badge */}
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); addCredits() }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); addCredits() } }}
            title="Add 100 credits"
            className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center hover:scale-110 transition-transform shadow-md cursor-pointer"
          >
            +
          </div>
        </button>
      </div>
    </div>
  )
}
