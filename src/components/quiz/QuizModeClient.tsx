'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { QuizMultipleChoice } from './QuizMultipleChoice'
import { QuizWritten } from './QuizWritten'
import { QuizMatch } from './QuizMatch'
import { QuizTutorPanel } from './QuizTutorPanel'
import { QuizReviewPanel, type WrongCardLog } from './QuizReviewPanel'
import { CompletionScreen } from '@/components/study/CompletionScreen'
import { BarProgress } from '@/components/layout/BarProgress'
import { useQuizSettings } from '@/hooks/useQuizSettings'
import { useCredits, DISTRACTOR_COST } from '@/components/layout/CreditsContext'
import { saveQuizResultAction } from '@/lib/actions'
import type { TutorMessage } from './QuizTutorPanel'
import type { Card } from '@/types'

type QuizType = 'multiple-choice' | 'written' | 'match'

interface Props {
  cards: Card[]
  setId: string
  setTitle: string
}

interface QuizStats {
  again: number
  hard: number
  good: number
  easy: number
  perfect: number
}

const QUIZ_TYPES: { id: QuizType; label: string; desc: string }[] = [
  { id: 'multiple-choice', label: 'Multiple Choice', desc: 'Pick the correct answer from 4 options' },
  { id: 'written', label: 'Written', desc: 'Type your answer and get AI feedback' },
  { id: 'match', label: 'Match', desc: 'Connect terms to their definitions' },
]

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function usePressAnimation(): [string, () => void] {
  const [anim, setAnim] = useState('')
  const trigger = useCallback(() => {
    setAnim('animate-press')
    setTimeout(() => setAnim(''), 400)
  }, [])
  return [anim, trigger]
}

export function QuizModeClient({ cards: initialCards, setId, setTitle }: Props) {
  const [quizType, setQuizType] = useState<QuizType | null>(null)
  const [cards, setCards] = useState<Card[]>(initialCards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [stats, setStats] = useState<QuizStats>({ again: 0, hard: 0, good: 0, easy: 0, perfect: 0 })
  const [pointsTotal, setPointsTotal] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [wrongCards, setWrongCards] = useState<WrongCardLog[]>([])
  const [showTutor, setShowTutor] = useState(false)
  const [tutorHistories, setTutorHistories] = useState<Map<string, TutorMessage[]>>(new Map())
  const hasSubmittedRef = useRef(false)
  const { settings } = useQuizSettings()
  // Cache of pre-fetched distractor options keyed by card id
  const prefetchCache = useRef<Map<string, string[]>>(new Map())

  const { credits: creditBalance } = useCredits()
  const [shuffleAnim, triggerShuffleAnim] = usePressAnimation()
  const [tutorAnim, triggerTutorAnim] = usePressAnimation()

  // Pre-fetch the next card's distractors in MC mode so there's no loading delay
  useEffect(() => {
    if (quizType !== 'multiple-choice') return
    const next = cards[currentIndex + 1]
    if (!next || prefetchCache.current.has(next.id)) return
    // Skip prefetch if user has no credits — QuizMultipleChoice will show the fallback
    if (creditBalance < DISTRACTOR_COST) return

    const existingAnswers = cards.filter((c) => c.id !== next.id).map((c) => c.back)
    fetch('/api/ai/distractors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correctAnswer: next.back, cardFront: next.front, existingAnswers }),
    })
      .then((r) => r.json())
      .then((data) => {
        const wrong: string[] = data.options ?? []
        prefetchCache.current.set(next.id, shuffleArray([next.back, ...wrong.slice(0, 3)]))
      })
      .catch(() => {
        // Do nothing — QuizMultipleChoice handles its own fallback on render
      })
  }, [currentIndex, quizType, cards, creditBalance])

  // Save quiz accuracy when session completes
  useEffect(() => {
    if (!isComplete || hasSubmittedRef.current || quizType === 'match') return
    hasSubmittedRef.current = true
    const correct = stats.perfect + stats.easy + stats.good
    saveQuizResultAction(correct, cards.length, pointsTotal).catch(console.error)
  }, [isComplete, quizType, stats, cards.length, pointsTotal])

  function handleTutorHistoryChange(cardId: string, msgs: TutorMessage[]) {
    setTutorHistories((prev) => new Map(prev).set(cardId, msgs))
  }

  function handleResult(correct: boolean, points: number = 0, userAnswer?: string) {
    setStats((prev) => ({
      ...prev,
      perfect: prev.perfect + (correct ? 1 : 0),
      again: prev.again + (correct ? 0 : 1),
    }))
    if (points > 0) setPointsTotal((p) => p + points)
    if (!correct) {
      const c = cards[currentIndex]
      if (c) {
        setWrongCards((prev) => [...prev, { id: c.id, front: c.front, back: c.back, userAnswer }])
      }
    }
    if (currentIndex + 1 >= cards.length) {
      setIsComplete(true)
    } else {
      setCurrentIndex((i) => i + 1)
      setShowTutor(false)
    }
  }

  function handleMatchComplete(score: number, total: number, wrongCardIds: string[] = []) {
    setStats({ again: total - score, hard: 0, good: 0, easy: 0, perfect: score })
    if (wrongCardIds.length > 0) {
      const wrongs: WrongCardLog[] = wrongCardIds
        .map((id) => cards.find((c) => c.id === id))
        .filter((c): c is Card => Boolean(c))
        .map((c) => ({ id: c.id, front: c.front, back: c.back }))
      setWrongCards(wrongs)
    }
    setIsComplete(true)
    saveQuizResultAction(score, total).catch(console.error)
  }

  function restart(newCards?: Card[]) {
    setCurrentIndex(0)
    setStats({ again: 0, hard: 0, good: 0, easy: 0, perfect: 0 })
    setPointsTotal(0)
    setIsComplete(false)
    setWrongCards([])
    setShowTutor(false)
    setTutorHistories(new Map())
    hasSubmittedRef.current = false
    if (newCards) setCards(newCards)
  }

  function handleShuffle() {
    triggerShuffleAnim()
    prefetchCache.current.clear()
    const shuffled = shuffleArray(cards)
    setCards(shuffled)
    setCurrentIndex(0)
    setStats({ again: 0, hard: 0, good: 0, easy: 0, perfect: 0 })
    setIsComplete(false)
    setShowTutor(false)
  }

  function handleTutor() {
    triggerTutorAnim()
    setShowTutor((v) => !v)
  }

  function handleSkip() {
    if (currentIndex + 1 >= cards.length) {
      setIsComplete(true)
    } else {
      setCurrentIndex((i) => i + 1)
      setShowTutor(false)
    }
  }

  function handleExplain() {
    setShowTutor(true)
  }

  if (!quizType) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/sets/${setId}`}
            className="text-sm rounded-lg border border-[var(--muted)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] px-3 py-1.5 transition-colors"
          >
            ← {setTitle}
          </Link>
        </div>
        <h1 className="mb-6 text-2xl font-bold">Choose Quiz Mode</h1>
        <div className="flex flex-col gap-3">
          {QUIZ_TYPES.map((qt) => (
            <button
              key={qt.id}
              onClick={() => setQuizType(qt.id)}
              disabled={cards.length < 2}
              className="rounded-xl border-2 border-[var(--card-border)] bg-[var(--card)] p-5 text-left hover:border-[var(--accent)] transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              <p className="font-semibold">{qt.label}</p>
              <p className="text-sm text-[var(--muted)] mt-1">{qt.desc}</p>
            </button>
          ))}
        </div>
        {cards.length < 2 && (
          <p className="mt-4 text-sm text-[var(--muted)] text-center">Add at least 2 cards to enable quiz mode.</p>
        )}
      </div>
    )
  }

  if (isComplete && quizType !== 'match') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <CompletionScreen setId={setId} stats={stats} total={cards.length} onStudyAgain={restart} setTitle={setTitle} />
        <QuizReviewPanel wrongCards={wrongCards} />
      </div>
    )
  }

  const currentCard = cards[currentIndex]

  return (
    <>
      <style>{`
        @keyframes press-bounce {
          0%   { transform: scale(1); }
          30%  { transform: scale(0.95); }
          65%  { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-press { animation: press-bounce 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      <div className={`mx-auto max-w-2xl px-4 py-8 transition-all duration-300 ${showTutor ? 'mr-[400px]' : ''}`}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => { setQuizType(null); restart() }}
            className="text-sm rounded-lg border border-[var(--muted)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] px-3 py-1.5 transition-colors active:scale-95"
          >
            ← Change Mode
          </button>

          {quizType !== 'match' && (
            <div className="flex flex-col items-end gap-2">
              <span className="text-sm text-[var(--muted)]">{currentIndex + 1}/{cards.length}</span>
              <div className="flex items-center gap-2">
                {/* Shuffle */}
                <button
                  onClick={handleShuffle}
                  className={`flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors ${shuffleAnim}`}
                  title="Shuffle cards"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 3 21 3 21 8"/>
                    <line x1="4" y1="20" x2="21" y2="3"/>
                    <polyline points="21 16 21 21 16 21"/>
                    <line x1="15" y1="15" x2="21" y2="21"/>
                  </svg>
                  Shuffle
                </button>

                {/* AI Tutor toggle */}
                <button
                  onClick={handleTutor}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${tutorAnim} ${
                    showTutor
                      ? 'bg-[var(--accent)] text-white border border-[var(--accent)]'
                      : 'border border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 hover:border-[var(--accent)]'
                  }`}
                  title="Open AI Tutor"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {showTutor ? 'Close Tutor' : 'Explain with AI'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mode tabs */}
        <div className="mb-6 flex gap-2">
          {QUIZ_TYPES.map((qt) => (
            <button
              key={qt.id}
              onClick={() => { setQuizType(qt.id); restart(); setShowTutor(false) }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors active:scale-95 ${
                quizType === qt.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {qt.label}
            </button>
          ))}
        </div>

        {quizType === 'multiple-choice' && !isComplete && (
          <QuizMultipleChoice
            key={currentCard.id}
            card={currentCard}
            allCards={cards}
            onResult={handleResult}
            onSkip={handleSkip}
            onExplain={handleExplain}
            clickToContinue={settings.clickToContinue}
            prefetchedOptions={prefetchCache.current.get(currentCard.id)}
            nextCard={cards[currentIndex + 1]}
          />
        )}
        {quizType === 'written' && !isComplete && (
          <QuizWritten
            key={currentCard.id}
            card={currentCard}
            onResult={handleResult}
            onSkip={handleSkip}
            onExplain={handleExplain}
            clickToContinue={settings.clickToContinue}
          />
        )}
        {quizType === 'match' && !isComplete && (
          <QuizMatch
            cards={cards}
            onComplete={handleMatchComplete}
            onSkip={() => restart()}
            onExplain={handleExplain}
          />
        )}
        {isComplete && quizType === 'match' && (
          <div className="text-center">
            <p className="text-2xl font-bold mb-2">All matched! 🎉</p>
            <p className="text-[var(--muted)] mb-6">{stats.perfect}/{stats.perfect + stats.again} correct</p>
            <button
              onClick={() => restart()}
              className="rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white active:scale-95 transition-transform"
            >
              Play Again
            </button>
            <QuizReviewPanel wrongCards={wrongCards} />
          </div>
        )}

        {/* AI usage bar at bottom of quiz */}
        <div className="mt-8 pt-4 border-t border-[var(--card-border)]">
          <BarProgress compact />
        </div>
      </div>

      {/* Right-side AI tutor panel */}
      <AnimatePresence>
        {showTutor && currentCard && (
          <QuizTutorPanel
            card={currentCard}
            onClose={() => setShowTutor(false)}
            history={tutorHistories.get(currentCard.id) ?? []}
            onHistoryChange={(msgs) => handleTutorHistoryChange(currentCard.id, msgs)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
