'use client'

import { useEffect, useRef, useState } from 'react'
import type { Card, GraderDifficulty } from '@/types'
import { DIFFICULTY_LABELS, DIFFICULTY_MULTIPLIERS } from '@/types'
import { useCredits, WRITTEN_GRADING_COST } from '@/components/layout/CreditsContext'

interface Props {
  card: Card
  onResult: (correct: boolean, points?: number, userAnswer?: string) => void
  onSkip?: () => void
  onExplain?: () => void
  clickToContinue?: boolean
}

const DIFFS: GraderDifficulty[] = ['easy', 'normal', 'hard', 'brutal']
const DIFF_STORAGE = 'cardlet_grader_difficulty'

export function QuizWritten({ card, onResult, onSkip, onExplain, clickToContinue = true }: Props) {
  const { consumeCredits } = useCredits()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<{ score: number; explanation: string; points: number; userAnswer: string } | null>(null)
  const [noCredits, setNoCredits] = useState(false)
  const [difficulty, setDifficulty] = useState<GraderDifficulty>('normal')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DIFF_STORAGE) as GraderDifficulty | null
      if (stored && DIFFS.includes(stored)) setDifficulty(stored)
    } catch {}
  }, [])

  function pickDifficulty(d: GraderDifficulty) {
    setDifficulty(d)
    try { localStorage.setItem(DIFF_STORAGE, d) } catch {}
  }

  useEffect(() => {
    setResult(null)
    setNoCredits(false)
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.focus()
    }
  }, [card.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const answer = inputRef.current?.value.trim()
    if (!answer || isChecking) return

    const ok = consumeCredits(WRITTEN_GRADING_COST)
    if (!ok) {
      setNoCredits(true)
      return
    }
    setNoCredits(false)

    setIsChecking(true)
    try {
      const res = await fetch('/api/ai/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: card.front,
          correctAnswer: card.back,
          userAnswer: answer,
          difficulty,
        }),
      })
      const data = await res.json()
      const points = Math.round((data.score ?? 0) * (DIFFICULTY_MULTIPLIERS[difficulty] ?? 1))
      setResult({ score: data.score, explanation: data.explanation, points, userAnswer: answer })
    } catch {
      const score = answer.toLowerCase() === card.back.toLowerCase() ? 10 : 3
      const points = Math.round(score * (DIFFICULTY_MULTIPLIERS[difficulty] ?? 1))
      setResult({ score, explanation: score === 10 ? 'Perfect!' : `The answer was: ${card.back}`, points, userAnswer: answer })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    if (!result) return

    if (!clickToContinue) {
      const timer = setTimeout(() => {
        onResult(result.score >= 7, result.points, result.userAnswer)
        setResult(null)
      }, 2000)
      return () => clearTimeout(timer)
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-explain-btn]')) return
      onResult(result.score >= 7, result.points, result.userAnswer)
      setResult(null)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [result, onResult, clickToContinue])

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center min-h-32 flex items-center justify-center">
        <p className="text-lg font-semibold">{card.front}</p>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Difficulty pills */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-semibold">Grader</span>
            <div className="flex gap-1.5 flex-1 flex-wrap justify-end">
              {DIFFS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => pickDifficulty(d)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    difficulty === d
                      ? 'bg-[var(--accent)] text-white'
                      : 'border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                  title={`${DIFFICULTY_MULTIPLIERS[d]}× points`}
                >
                  {DIFFICULTY_LABELS[d]} · {DIFFICULTY_MULTIPLIERS[d]}×
                </button>
              ))}
            </div>
          </div>

          <input
            ref={inputRef}
            placeholder="Type your answer…"
            disabled={isChecking}
            className="w-full rounded-xl border-2 border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm focus:border-[var(--accent)] focus:outline-none"
          />
          {noCredits && (
            <p className="text-xs text-red-400 text-center">Not enough credits to grade. Add more from the credits widget.</p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isChecking}
              className="flex-1 rounded-xl bg-[var(--accent)] py-3 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {isChecking ? 'Checking…' : `Submit Answer (${WRITTEN_GRADING_COST} credit)`}
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                disabled={isChecking}
                className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors disabled:opacity-40"
              >
                Skip
              </button>
            )}
          </div>
          <p className="text-center text-[10px] text-[var(--muted)]">⚠️ AI grading can make mistakes. Harder grading = more points but stricter scores.</p>
        </form>
      ) : (
        <div className={`rounded-xl border-2 p-5 ${
          result.score >= 9 ? 'border-blue-500 bg-blue-500/10' :
          result.score >= 7 ? 'border-green-500 bg-green-500/10' :
          result.score >= 5 ? 'border-yellow-500 bg-yellow-500/10' :
          'border-red-500 bg-red-500/10'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`font-semibold text-lg ${
              result.score >= 9 ? 'text-blue-400' :
              result.score >= 7 ? 'text-green-400' :
              result.score >= 5 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {result.score >= 7 ? '✓' : '✗'} {result.score}/10
            </p>
            <span className="rounded-full bg-[var(--accent)]/20 text-[var(--accent)] px-3 py-1 text-xs font-bold">
              +{result.points} pts
            </span>
          </div>
          <p className="text-sm mb-3">{result.explanation}</p>
          {result.score < 7 && (
            <p className="mt-2 text-sm text-[var(--muted)]">
              Correct answer: <strong>{card.back}</strong>
            </p>
          )}

          {/* Explain with AI */}
          {onExplain && (
            <button
              data-explain-btn
              onClick={(e) => { e.stopPropagation(); onExplain() }}
              className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-3 py-2 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Explain with AI
            </button>
          )}

          <p className="mt-3 text-xs text-[var(--muted)]">{clickToContinue ? 'Tap anywhere to continue.' : 'Continuing shortly…'}</p>
          <p className="mt-1 text-[10px] text-[var(--muted)]">⚠️ AI can make mistakes. Review answers carefully.</p>
        </div>
      )}
    </div>
  )
}
