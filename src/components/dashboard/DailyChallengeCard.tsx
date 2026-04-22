'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import type { DailyChallengeCard as DailyCard } from '@/types'

interface Props {
  card: DailyCard
}

function todayKey() {
  // UTC date matches the SQL CURRENT_DATE used by the RPC.
  return new Date().toISOString().slice(0, 10)
}

export function DailyChallengeCard({ card }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState<boolean | null>(null)

  useEffect(() => {
    setDone(localStorage.getItem(`daily_challenge_${todayKey()}`) === '1')
  }, [])

  function markDone() {
    localStorage.setItem(`daily_challenge_${todayKey()}`, '1')
    setDone(true)
  }

  if (done === null) return null // initial mount, avoid flash

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-2xl border p-5"
      style={{
        borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, transparent) 0%, color-mix(in srgb, var(--accent) 4%, transparent) 45%, transparent 100%)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <h3 className="font-bold text-sm">Daily Challenge</h3>
          {done && <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: 'var(--accent)' }}>· Done</span>}
        </div>
        <Link
          href={`/sets/${card.set_id}`}
          className="text-[11px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors truncate max-w-32"
        >
          from {card.set_title} →
        </Link>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped((f) => !f) } }}
        className="relative w-full min-h-24 rounded-xl bg-[var(--card)] border border-[var(--card-border)] p-4 text-center cursor-pointer hover:border-[var(--accent)] transition-colors flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={flipped ? 'back' : 'front'}
            initial={{ opacity: 0, rotateX: 90 }}
            animate={{ opacity: 1, rotateX: 0 }}
            exit={{ opacity: 0, rotateX: -90 }}
            transition={{ duration: 0.18 }}
            className="text-sm font-medium"
          >
            {flipped ? card.back : card.front}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-[var(--muted)]">
          {flipped ? 'Did you know it?' : 'Tap to reveal'}
        </p>
        {flipped && !done && (
          <div className="flex gap-2">
            <button
              onClick={markDone}
              className="rounded-full border border-[var(--card-border)] px-3 py-1 text-[11px] font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors"
            >
              Missed it
            </button>
            <button
              onClick={markDone}
              className="rounded-full px-3 py-1 text-[11px] font-semibold text-white transition-colors"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)' }}
            >
              Got it ✓
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
