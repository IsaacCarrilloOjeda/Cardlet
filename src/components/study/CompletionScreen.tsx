'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface Stats {
  again: number
  hard: number
  good: number
  easy: number
  perfect: number
}

interface Props {
  setId: string
  stats: Stats
  total: number
  onStudyAgain: () => void
  backHref?: string
}

export function CompletionScreen({ setId, stats, total, onStudyAgain, backHref }: Props) {
  const back = backHref ?? `/sets/${setId}`
  const pct = total === 0 ? 0 : Math.round(((stats.good + stats.easy + stats.perfect) / total) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col items-center gap-6 text-center max-w-md mx-auto"
    >
      <div className="text-6xl">🎉</div>
      <div>
        <h2 className="text-2xl font-bold mb-1">Session Complete!</h2>
        <p className="text-[var(--muted)]">You reviewed {total} cards</p>
      </div>

      {/* Score ring */}
      <div className="relative flex h-32 w-32 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--card-border)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            stroke="var(--accent)" strokeWidth="10"
            strokeDasharray={`${(pct / 100) * 314} 314`}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-3xl font-bold">{pct}%</span>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-5 gap-2 w-full">
        <div className="rounded-xl bg-red-600/10 border border-red-600/20 p-2">
          <p className="text-xl font-bold text-red-400">{stats.again}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Again</p>
        </div>
        <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-2">
          <p className="text-xl font-bold text-orange-400">{stats.hard}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Hard</p>
        </div>
        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-2">
          <p className="text-xl font-bold text-yellow-400">{stats.good}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Good</p>
        </div>
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-2">
          <p className="text-xl font-bold text-green-400">{stats.easy}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Easy</p>
        </div>
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-2">
          <p className="text-xl font-bold text-blue-400">{stats.perfect}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Perfect</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full">
        <button
          onClick={onStudyAgain}
          className="flex-1 rounded-xl border border-[var(--card-border)] py-3 text-sm font-medium hover:border-[var(--accent)] transition-colors"
        >
          Study Again
        </button>
        <Link
          href={back}
          className="flex-1 rounded-xl bg-[var(--accent)] py-3 text-center text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          {backHref ? 'Done' : 'Back to Set'}
        </Link>
      </div>
    </motion.div>
  )
}
