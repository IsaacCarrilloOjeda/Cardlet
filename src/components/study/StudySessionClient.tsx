'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { updateCardProgressAction } from '@/lib/actions'
import { qualityFromConfidence } from '@/lib/sm2'
import { CardFlip } from './CardFlip'
import { ConfidenceButtons } from './ConfidenceButtons'
import { ProgressBar } from './ProgressBar'
import { CompletionScreen } from './CompletionScreen'
import { AITutorChat } from './AITutorChat'
import { PomodoroTimer } from './PomodoroTimer'
import { ShortcutsModal } from './ShortcutsModal'
import { useCredits, HINT_COST } from '@/components/layout/CreditsContext'
import { useStarredCards } from '@/hooks/useStarredCards'
import type { CardWithProgress } from '@/types'

interface Props {
  cards: CardWithProgress[]
  setId: string
  setTitle: string
  backHref?: string
}

interface SessionStats {
  again: number
  hard: number
  good: number
  easy: number
  perfect: number
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function StudySessionClient({ cards, setId, setTitle, backHref }: Props) {
  const back = backHref ?? `/sets/${setId}`
  const [deck, setDeck] = useState(cards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [stats, setStats] = useState<SessionStats>({ again: 0, hard: 0, good: 0, easy: 0, perfect: 0 })
  const [, startTransition] = useTransition()
  const [showTutor, setShowTutor] = useState(false)
  const [shuffleAnim, setShuffleAnim] = useState('')
  const [cramMode, setCramMode] = useState(false)
  const [reverseMode, setReverseMode] = useState(false)
  const [starredOnly, setStarredOnly] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [hint, setHint] = useState<{ text: string; level: number } | null>(null)
  const [hintLoading, setHintLoading] = useState(false)
  const { consumeCredits } = useCredits()
  const { starredIds } = useStarredCards(setId)

  function handleShuffle() {
    setShuffleAnim('scale-[0.95]')
    setTimeout(() => setShuffleAnim('scale-[1.05]'), 120)
    setTimeout(() => setShuffleAnim('scale-100'), 240)
    setDeck(shuffleArray(deck))
    setCurrentIndex(0)
    setIsFlipped(false)
    setShowTutor(false)
  }

  function handleStarredOnly() {
    const next = !starredOnly
    setStarredOnly(next)
    setCurrentIndex(0)
    setIsFlipped(false)
    setIsComplete(false)
    setShowTutor(false)
    if (next) {
      const filtered = cards.filter((c) => starredIds.has(c.id))
      setDeck(filtered.length > 0 ? filtered : cards)
    } else {
      setDeck(cards)
    }
  }

  const currentCard = deck[currentIndex]

  const handleConfidence = useCallback((rating: 'again' | 'hard' | 'good' | 'easy' | 'perfect') => {
    if (!currentCard) return

    setStats((prev) => ({ ...prev, [rating]: prev[rating] + 1 }))
    setHint(null)

    // Open AI tutor for completely failed cards (skipped in cram mode)
    if (rating === 'again' && !cramMode) {
      setShowTutor(true)
      return
    }

    // Fire-and-forget SM-2 update — disabled in cram mode
    if (!cramMode) {
      const quality = qualityFromConfidence(rating)
      startTransition(async () => {
        await updateCardProgressAction(currentCard.id, quality)
      })
    }

    // Advance
    if (currentIndex + 1 >= deck.length) {
      setIsComplete(true)
    } else {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }, [currentCard, currentIndex, deck.length, cramMode])

  async function handleHint() {
    if (!currentCard || hintLoading) return
    const nextLevel = ((hint?.level ?? 0) + 1) as 1 | 2 | 3
    if (nextLevel > 3) return
    if (!consumeCredits(HINT_COST)) return
    setHintLoading(true)
    try {
      const res = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentCard.front, answer: currentCard.back, level: nextLevel }),
      })
      const data = await res.json()
      if (res.ok) setHint({ text: data.hint, level: nextLevel })
    } finally {
      setHintLoading(false)
    }
  }

  // Reset hint when card changes
  useEffect(() => { setHint(null) }, [currentIndex])

  // Focus mode — hide the sticky header
  useEffect(() => {
    if (focusMode) {
      document.body.classList.add('focus-mode')
    } else {
      document.body.classList.remove('focus-mode')
    }
    return () => { document.body.classList.remove('focus-mode') }
  }, [focusMode])

  const handleSkip = useCallback(() => {
    if (currentIndex + 1 >= deck.length) {
      setIsComplete(true)
    } else {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
      setShowTutor(false)
    }
  }, [currentIndex, deck.length])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isComplete) return
      if (!currentCard) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          setIsFlipped((f) => !f)
          break
        case '1':
          if (isFlipped) handleConfidence('again')
          break
        case '2':
          if (isFlipped) handleConfidence('hard')
          break
        case '3':
          if (isFlipped) handleConfidence('good')
          break
        case '4':
          if (isFlipped) handleConfidence('easy')
          break
        case '5':
          if (isFlipped) handleConfidence('perfect')
          break
        case 's':
        case 'S':
          handleSkip()
          break
        case '?':
          setShowShortcuts((v) => !v)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFlipped, isComplete, currentCard, handleConfidence, handleSkip])

  function handleTutorClose() {
    setShowTutor(false)
    // Now apply SM-2 for 'unknown' and advance
    if (!currentCard) return
    startTransition(async () => {
      await updateCardProgressAction(currentCard.id, 1)
    })
    if (currentIndex + 1 >= deck.length) {
      setIsComplete(true)
    } else {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  function handleStudyAgain() {
    setDeck(cards)
    setCurrentIndex(0)
    setIsFlipped(false)
    setIsComplete(false)
    setShowTutor(false)
    setStats({ again: 0, hard: 0, good: 0, easy: 0, perfect: 0 })
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-[var(--muted)]">No cards in this set yet.</p>
        <Link href={back} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white">
          Add Cards
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
        <Link href={back} className="text-sm rounded-lg border border-[var(--muted)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] px-3 py-1.5 transition-colors inline-flex items-center gap-1 shrink-0">
          ← {setTitle}
        </Link>
        <div className="flex items-center gap-2">
        <button
          onClick={handleStarredOnly}
          title={starredOnly ? 'Showing starred cards only' : 'Study starred cards only'}
          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
            starredOnly
              ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
              : 'border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]'
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill={starredOnly ? 'var(--accent)' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          {starredOnly ? `Starred (${deck.length})` : 'Starred'}
        </button>
        <button
          onClick={() => setCramMode((v) => !v)}
          title={cramMode ? 'Cram mode on — SM-2 paused' : 'Toggle cram mode'}
          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            cramMode
              ? 'bg-orange-500 text-white border-orange-500'
              : 'border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3C10 6 6 9 6 14C6 18 9 22 12 22C15 22 18 18 18 14C18 9 15 6 14 5C14 8 13 10 13 10C12.5 7 12.5 5 12 3Z"/>
              <path d="M12 13C10.5 15 10 17.5 11 20C11.5 21.5 12.5 21.5 13 20C14 17.5 13.5 15 12 13Z"/>
            </svg>
            Cram
          </span>
        </button>
        <button
          onClick={() => { setReverseMode((v) => !v); setIsFlipped(false) }}
          title={reverseMode ? 'Reverse mode on — back side is the prompt' : 'Swap front and back'}
          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            reverseMode
              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
              : 'border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]'
          }`}
        >
          ↔ Reverse
        </button>
        <button
          onClick={handleShuffle}
          className={`flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-all duration-100 ${shuffleAnim}`}
          title="Shuffle deck"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
            <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
          </svg>
          Shuffle
        </button>
        <button
          onClick={() => setFocusMode((v) => !v)}
          title={focusMode ? 'Exit focus mode' : 'Focus mode — hide nav'}
          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
            focusMode
              ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
              : 'border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]'
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
          Focus
        </button>
        <button
          onClick={() => setShowShortcuts(true)}
          title="Keyboard shortcuts (?)"
          className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2.5 py-1.5 text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
        >
          ?
        </button>
        </div>
        </div>
        <PomodoroTimer />
      </div>
</div>

      {isComplete ? (
        <CompletionScreen
          setId={setId}
          stats={stats}
          total={deck.length}
          onStudyAgain={handleStudyAgain}
          backHref={backHref}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Progress */}
          <ProgressBar current={currentIndex} total={deck.length} />

          {/* Card */}
          <CardFlip
            front={reverseMode ? currentCard.back : currentCard.front}
            back={reverseMode ? currentCard.front : currentCard.back}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
          />

          {/* Confidence */}
          <ConfidenceButtons visible={isFlipped} onConfidence={handleConfidence} />

          {/* Hint when not flipped */}
          {!isFlipped && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-center text-xs text-[var(--muted)]">
                Press Space or click the card to reveal the answer
              </p>
              <button
                onClick={handleHint}
                disabled={hintLoading || (hint?.level ?? 0) >= 3}
                className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)] px-3 py-1 text-[11px] font-medium hover:bg-[var(--accent)]/20 transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6"/>
                  <path d="M9 17h6M10 19h4"/>
                  <path d="M9 14c0-1.5 1-2.5 3-4 2 1.5 3 2.5 3 4"/>
                </svg>
                {hintLoading
                  ? 'Thinking…'
                  : hint
                  ? (hint.level >= 3 ? 'No more hints' : `Stronger hint? (${HINT_COST})`)
                  : `Hint (${HINT_COST} cr)`}
              </button>
              {hint && (
                <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-3 py-2 text-xs text-[var(--foreground)] max-w-md text-center">
                  <span className="text-[10px] uppercase font-bold text-[var(--accent)] mr-1">Tier {hint.level}</span>
                  {hint.text}
                </div>
              )}
            </div>
          )}

          {/* Skip */}
          <div className="flex justify-center">
            <button
              onClick={handleSkip}
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] underline underline-offset-2 transition-colors"
            >
              Skip →
            </button>
          </div>
        </div>
      )}

      {showTutor && currentCard && (
        <AITutorChat
          cardFront={currentCard.front}
          cardBack={currentCard.back}
          wrongAnswer="(marked as unknown)"
          onClose={handleTutorClose}
        />
      )}

      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  )
}
