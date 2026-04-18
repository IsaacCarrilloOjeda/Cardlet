'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Stats {
  again: number
  hard: number
  good: number
  easy: number
  perfect: number
}

interface CramStats {
  correct: number
  total: number
  timerSecs: number
}

interface Props {
  setId: string
  stats: Stats
  total: number
  onStudyAgain: () => void
  backHref?: string
  cramStats?: CramStats
  setTitle?: string
  username?: string
  level?: number
}

export function CompletionScreen({ setId, stats, total, onStudyAgain, backHref, cramStats, setTitle, username, level }: Props) {
  const back = backHref ?? `/sets/${setId}`
  const pct = total === 0 ? 0 : Math.round(((stats.good + stats.easy + stats.perfect) / total) * 100)
  const [isSharing, setIsSharing] = useState(false)
  const [shareMsg, setShareMsg] = useState<string | null>(null)

  async function handleShare() {
    setIsSharing(true)
    setShareMsg(null)
    try {
      const params = new URLSearchParams({
        score: String(pct),
        total: String(total),
        setTitle: setTitle ?? 'Study Session',
        level: String(level ?? 1),
        username: username ?? '',
      })
      const res = await fetch(`/api/share-card?${params}`)
      if (!res.ok) throw new Error('Failed to generate image')
      const blob = await res.blob()

      // Try clipboard first
      try {
        if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          setShareMsg('Copied to clipboard!')
        }
      } catch {
        // Clipboard not supported, fall through to download
      }

      // Also trigger download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'cardlet-result.png'
      a.click()
      URL.revokeObjectURL(url)
      if (!shareMsg) setShareMsg('Downloaded!')
    } catch {
      setShareMsg('Failed to generate')
    } finally {
      setIsSharing(false)
      setTimeout(() => setShareMsg(null), 3000)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col items-center gap-6 text-center max-w-md mx-auto"
    >
      <div className="text-6xl">{cramStats ? '' : ''}</div>
      <div>
        <h2 className="text-2xl font-bold mb-1">
          {cramStats ? 'Cram Session Complete!' : 'Session Complete!'}
        </h2>
        <p className="text-[var(--muted)]">You reviewed {total} cards</p>
      </div>

      {/* Score ring */}
      <div className="relative flex h-32 w-32 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--card-border)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            stroke={cramStats ? '#f97316' : 'var(--accent)'} strokeWidth="10"
            strokeDasharray={`${(pct / 100) * 314} 314`}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-3xl font-bold">{pct}%</span>
      </div>

      {/* Cram summary */}
      {cramStats && cramStats.total > 0 && (
        <div className="w-full rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
          <p className="text-xs uppercase tracking-wider text-orange-400 font-semibold mb-2">Cram Summary</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-orange-400">{cramStats.timerSecs}s</p>
              <p className="text-[10px] text-[var(--muted)]">Timer</p>
            </div>
            <div>
              <p className="text-lg font-bold">{cramStats.correct}/{cramStats.total}</p>
              <p className="text-[10px] text-[var(--muted)]">Correct</p>
            </div>
            <div>
              <p className="text-lg font-bold text-orange-400">
                {Math.round((cramStats.correct / cramStats.total) * 100)}%
              </p>
              <p className="text-[10px] text-[var(--muted)]">Accuracy</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Share */}
      <button
        onClick={handleShare}
        disabled={isSharing}
        className="flex items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] w-full py-2.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors disabled:opacity-50"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        {isSharing ? 'Generating...' : shareMsg ?? 'Share Result'}
      </button>
    </motion.div>
  )
}
