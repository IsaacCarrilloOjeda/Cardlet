'use client'

import { useState } from 'react'
import type { Card } from '@/types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Props {
  cards: Card[]
  onComplete: (score: number, total: number) => void
  onSkip?: () => void
  onExplain?: () => void
}

type MatchState = 'idle' | 'selected-front' | 'correct' | 'wrong'

interface Item {
  id: string
  text: string
  matched: boolean
}

export function QuizMatch({ cards, onComplete, onSkip, onExplain }: Props) {
  const subset = cards.slice(0, 8)

  const [fronts] = useState<Item[]>(() =>
    shuffle(subset.map((c) => ({ id: c.id, text: c.front, matched: false })))
  )
  const [backs, setBacks] = useState<Item[]>(() =>
    shuffle(subset.map((c) => ({ id: c.id, text: c.back, matched: false })))
  )
  const [matchedFronts, setMatchedFronts] = useState<Item[]>(fronts)
  const [selectedFront, setSelectedFront] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ id: string; correct: boolean } | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)

  function handleFront(id: string) {
    if (matchedFronts.find((f) => f.id === id)?.matched) return
    setSelectedFront(id)
  }

  function handleBack(id: string) {
    if (!selectedFront) return
    const item = backs.find((b) => b.id === id)
    if (!item || item.matched) return

    const isCorrect = selectedFront === id
    setFlash({ id, correct: isCorrect })
    setTotal((t) => t + 1)

    setTimeout(() => {
      setFlash(null)
      if (isCorrect) {
        setScore((s) => {
          const next = s + 1
          if (next >= subset.length) {
            setTimeout(() => onComplete(next, subset.length), 400)
          }
          return next
        })
        setMatchedFronts((prev) => prev.map((f) => (f.id === id ? { ...f, matched: true } : f)))
        setBacks((prev) => prev.map((b) => (b.id === id ? { ...b, matched: true } : b)))
      }
      setSelectedFront(null)
    }, 600)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--muted)] text-center">Click a term, then its matching definition</p>
      <div className="grid grid-cols-2 gap-3">
        {/* Fronts column */}
        <div className="flex flex-col gap-2">
          {matchedFronts.map((item) => (
            <button
              key={item.id}
              onClick={() => handleFront(item.id)}
              disabled={item.matched}
              className={`rounded-xl border-2 p-3 text-sm text-left transition-all ${
                item.matched
                  ? 'border-green-500/30 bg-green-500/10 text-green-400 opacity-60'
                  : selectedFront === item.id
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--accent)] cursor-pointer'
              }`}
            >
              {item.text}
            </button>
          ))}
        </div>

        {/* Backs column */}
        <div className="flex flex-col gap-2">
          {backs.map((item) => (
            <button
              key={item.id}
              onClick={() => handleBack(item.id)}
              disabled={item.matched || !selectedFront}
              className={`rounded-xl border-2 p-3 text-sm text-left transition-all ${
                item.matched
                  ? 'border-green-500/30 bg-green-500/10 text-green-400 opacity-60'
                  : flash?.id === item.id
                  ? flash.correct
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-red-500 bg-red-500/10'
                  : selectedFront
                  ? 'border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--accent)] cursor-pointer'
                  : 'border-[var(--card-border)] bg-[var(--card)] opacity-60 cursor-not-allowed'
              }`}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--muted)]">{score}/{subset.length} matched</span>
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] underline underline-offset-2 transition-colors"
          >
            Skip Round →
          </button>
        )}
      </div>

      {/* Explain with AI */}
      {onExplain && (
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onExplain}
            className="flex items-center gap-2 rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Explain with AI
          </button>
          <p className="text-[10px] text-[var(--muted)]">⚠️ AI can make mistakes. Review answers carefully.</p>
        </div>
      )}
    </div>
  )
}
