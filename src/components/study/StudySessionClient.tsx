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
import type { CardWithProgress } from '@/types'

interface Props {
  cards: CardWithProgress[]
  setId: string
  setTitle: string
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

export function StudySessionClient({ cards, setId, setTitle }: Props) {
  const [deck, setDeck] = useState(cards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [stats, setStats] = useState<SessionStats>({ again: 0, hard: 0, good: 0, easy: 0, perfect: 0 })
  const [, startTransition] = useTransition()
  const [showTutor, setShowTutor] = useState(false)
  const [shuffleAnim, setShuffleAnim] = useState('')

  function handleShuffle() {
    setShuffleAnim('scale-[0.95]')
    setTimeout(() => setShuffleAnim('scale-[1.05]'), 120)
    setTimeout(() => setShuffleAnim('scale-100'), 240)
    setDeck(shuffleArray(deck))
    setCurrentIndex(0)
    setIsFlipped(false)
    setShowTutor(false)
  }

  const currentCard = deck[currentIndex]

  const handleConfidence = useCallback((rating: 'again' | 'hard' | 'good' | 'easy' | 'perfect') => {
    if (!currentCard) return

    setStats((prev) => ({ ...prev, [rating]: prev[rating] + 1 }))

    // Open AI tutor for completely failed cards
    if (rating === 'again') {
      setShowTutor(true)
      return
    }

    // Fire-and-forget SM-2 update
    const quality = qualityFromConfidence(rating)
    startTransition(async () => {
      await updateCardProgressAction(currentCard.id, quality)
    })

    // Advance
    if (currentIndex + 1 >= deck.length) {
      setIsComplete(true)
    } else {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }, [currentCard, currentIndex, deck.length])

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
        <Link href={`/sets/${setId}`} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white">
          Add Cards
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/sets/${setId}`} className="text-sm rounded-lg border border-[var(--muted)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] px-3 py-1.5 transition-colors inline-flex items-center gap-1">
          ← {setTitle}
        </Link>
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
      </div>

      {isComplete ? (
        <CompletionScreen
          setId={setId}
          stats={stats}
          total={deck.length}
          onStudyAgain={handleStudyAgain}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Progress */}
          <ProgressBar current={currentIndex} total={deck.length} />

          {/* Card */}
          <CardFlip
            front={currentCard.front}
            back={currentCard.back}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
          />

          {/* Confidence */}
          <ConfidenceButtons visible={isFlipped} onConfidence={handleConfidence} />

          {/* Hint when not flipped */}
          {!isFlipped && (
            <p className="text-center text-xs text-[var(--muted)]">
              Press Space or click the card to reveal the answer
            </p>
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
    </div>
  )
}
