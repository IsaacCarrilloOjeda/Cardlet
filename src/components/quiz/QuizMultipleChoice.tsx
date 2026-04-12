'use client'

import { useEffect, useRef, useState } from 'react'
import type { Card } from '@/types'
import { useCredits, DISTRACTOR_COST } from '@/components/layout/CreditsContext'

interface Props {
  card: Card
  allCards: Card[]
  onResult: (correct: boolean, points?: number, userAnswer?: string) => void
  onSkip?: () => void
  onExplain?: () => void
  clickToContinue?: boolean
  prefetchedOptions?: string[]
  nextCard?: Card
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function QuizMultipleChoice({ card, allCards, onResult, onSkip, onExplain, clickToContinue = false, prefetchedOptions, nextCard }: Props) {
  const { credits: creditBalance, consumeCredits } = useCredits()
  const [options, setOptions] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [noCreditsWarning, setNoCreditsWarning] = useState(false)
  const pendingResultRef = useRef<boolean | null>(null)
  // Resets per-card because this component is keyed by card.id
  const creditDeductedRef = useRef(false)

  useEffect(() => {
    setSelected(null)
    pendingResultRef.current = null
    creditDeductedRef.current = false
    setIsLoading(true)
    setNoCreditsWarning(false)

    const existingAnswers = allCards.filter((c) => c.id !== card.id).map((c) => c.back)

    // Use pre-fetched options if available — deduct credit for the AI work already done
    if (prefetchedOptions && prefetchedOptions.length > 0) {
      setOptions(prefetchedOptions)
      setIsLoading(false)
      if (!creditDeductedRef.current) {
        consumeCredits(DISTRACTOR_COST)
        creditDeductedRef.current = true
      }
      return
    }

    // No credits — skip AI, use cards from the set as fallback options
    if (creditBalance < DISTRACTOR_COST) {
      setOptions(shuffle([card.back, ...existingAnswers.slice(0, 3)]))
      setIsLoading(false)
      setNoCreditsWarning(true)
      return
    }

    fetch('/api/ai/distractors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correctAnswer: card.back, cardFront: card.front, existingAnswers }),
    })
      .then((r) => r.json())
      .then((data) => {
        const wrong: string[] = data.options ?? []
        setOptions(shuffle([card.back, ...wrong.slice(0, 3)]))
        if (!creditDeductedRef.current) {
          consumeCredits(DISTRACTOR_COST)
          creditDeductedRef.current = true
        }
      })
      .catch(() => {
        // API error — fallback to set answers, no charge
        setOptions(shuffle([card.back, ...existingAnswers.slice(0, 3)]))
        setNoCreditsWarning(true)
      })
      .finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id])

  // Click-to-continue: listen for any click after answering
  useEffect(() => {
    if (!selected || !clickToContinue) return
    const correct = selected === card.back

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-explain-btn]')) return
      onResult(correct, 0, selected)
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [selected, clickToContinue, card.back, onResult])

  function handleSelect(option: string) {
    if (selected) return
    setSelected(option)
    const correct = option === card.back
    if (!clickToContinue) {
      setTimeout(() => onResult(correct, 0, option), 1200)
    }
    // else: wait for click (handled by useEffect above)
  }

  // Keyboard shortcuts: 1-4 to pick an option, S to skip
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (selected || isLoading || options.length === 0) return
      const n = parseInt(e.key, 10)
      if (n >= 1 && n <= options.length) {
        e.preventDefault()
        handleSelect(options[n - 1])
        return
      }
      if ((e.key === 's' || e.key === 'S') && onSkip) {
        e.preventDefault()
        onSkip()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, isLoading, options])

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center min-h-32 flex items-center justify-center">
        <p className="text-lg font-semibold">{card.front}</p>
      </div>

      {onSkip && !selected && (
        <div className="flex justify-end">
          <button
            onClick={onSkip}
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] underline underline-offset-2 transition-colors"
          >
            Skip →
          </button>
        </div>
      )}

      {noCreditsWarning && !selected && (
        <p className="text-center text-xs text-[var(--muted)]">
          Out of credits — showing options from your set instead of AI distractors.
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--card)]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {options.map((option, i) => {
            const isCorrect = option === card.back
            const isSelected = selected === option
            let cls = 'rounded-xl border-2 p-4 text-sm text-left transition-all flex items-start gap-2'
            if (!selected) {
              cls += ' border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--accent)] cursor-pointer'
            } else if (isCorrect) {
              cls += ' border-green-500 bg-green-500/10 text-green-400'
            } else if (isSelected && !isCorrect) {
              cls += ' border-red-500 bg-red-500/10 text-red-400'
            } else {
              cls += ' border-[var(--card-border)] bg-[var(--card)] opacity-50'
            }
            return (
              <button key={option} className={cls} onClick={() => handleSelect(option)}>
                <kbd className="hidden sm:inline-flex shrink-0 items-center justify-center w-5 h-5 rounded text-[10px] font-mono bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted)]">
                  {i + 1}
                </kbd>
                <span className="flex-1">{option}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* After answering */}
      {selected && (
        <div className="flex flex-col gap-2">
          {onExplain && (
            <button
              data-explain-btn
              onClick={(e) => { e.stopPropagation(); onExplain() }}
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Explain with AI
            </button>
          )}
          {clickToContinue && (
            <p className="text-center text-xs text-[var(--muted)]">Tap anywhere to continue →</p>
          )}
          <p className="text-center text-[10px] text-[var(--muted)]">⚠️ AI can make mistakes. Review answers carefully.</p>
        </div>
      )}

      {/* Next question preview — pre-renders so options are ready when you advance */}
      {selected && nextCard && (
        <div className="mt-2 pt-4 border-t border-[var(--card-border)]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2 font-medium">Next up</p>
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)]/50 px-5 py-3 text-sm text-center text-[var(--muted)]">
            {nextCard.front}
          </div>
        </div>
      )}
    </div>
  )
}
