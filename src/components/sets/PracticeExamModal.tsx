'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCredits, PRACTICE_EXAM_COST } from '@/components/layout/CreditsContext'

interface ExamQuestion {
  type: 'mc' | 'written' | 'tf'
  question: string
  options?: string[]
  answer: string
  topic: string
}

interface Props {
  setId: string
  onClose: () => void
}

export function PracticeExamModal({ setId, onClose }: Props) {
  const { credits, consumeCredits } = useCredits()
  const [questions, setQuestions] = useState<ExamQuestion[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    async function load() {
      if (!consumeCredits(PRACTICE_EXAM_COST)) {
        setError(`Practice exam costs ${PRACTICE_EXAM_COST} credits. You have ${credits}.`)
        setLoading(false)
        return
      }
      try {
        const res = await fetch('/api/ai/practice-exam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed')
        setQuestions(data.questions)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed')
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const score = submitted && questions
    ? questions.filter((q, i) => (answers[i] ?? '').trim().toLowerCase() === q.answer.trim().toLowerCase()).length
    : 0

  const weakTopics = submitted && questions
    ? Array.from(new Set(
        questions
          .filter((q, i) => (answers[i] ?? '').trim().toLowerCase() !== q.answer.trim().toLowerCase())
          .map((q) => q.topic)
      ))
    : []

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">📝 AI Practice Exam</h2>
            <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)]" aria-label="Close">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          {loading && <p className="text-center text-sm text-[var(--muted)] py-8">Generating your exam…</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {questions && !submitted && (
            <div className="flex flex-col gap-4">
              {questions.map((q, i) => (
                <div key={i} className="rounded-xl border border-[var(--card-border)] p-3">
                  <p className="text-xs text-[var(--muted)] mb-1">Q{i + 1} · {q.topic} · {q.type.toUpperCase()}</p>
                  <p className="text-sm font-medium mb-2">{q.question}</p>
                  {q.type === 'mc' && q.options ? (
                    <div className="flex flex-col gap-1">
                      {q.options.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name={`q${i}`}
                            value={opt}
                            checked={answers[i] === opt}
                            onChange={() => setAnswers({ ...answers, [i]: opt })}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={answers[i] ?? ''}
                      onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                      className="w-full rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1 text-sm"
                    />
                  )}
                </div>
              ))}
              <button
                onClick={() => setSubmitted(true)}
                className="rounded-xl bg-[var(--accent)] py-3 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                Submit
              </button>
            </div>
          )}

          {submitted && questions && (
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-[var(--accent)]">{score}/{questions.length}</p>
                <p className="text-sm text-[var(--muted)]">{Math.round((score / questions.length) * 100)}% correct</p>
              </div>
              {weakTopics.length > 0 && (
                <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3">
                  <p className="text-sm font-semibold text-orange-400 mb-1">Weak topics:</p>
                  <p className="text-xs">{weakTopics.join(' · ')}</p>
                </div>
              )}
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                {questions.map((q, i) => {
                  const correct = (answers[i] ?? '').trim().toLowerCase() === q.answer.trim().toLowerCase()
                  return (
                    <div key={i} className={`rounded-lg border p-2 text-xs ${correct ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                      <p className="font-medium">{q.question}</p>
                      <p>Your answer: {answers[i] ?? '—'}</p>
                      {!correct && <p>Correct: {q.answer}</p>}
                    </div>
                  )
                })}
              </div>
              <button onClick={onClose} className="rounded-xl border border-[var(--card-border)] py-2 text-sm">Close</button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
