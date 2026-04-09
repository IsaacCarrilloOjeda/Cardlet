'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Card } from '@/types'
import { useCredits, TUTOR_FULL_COST, TUTOR_HALF_COST } from '@/components/layout/CreditsContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  card: Card
  wrongAnswer?: string | null
  onClose: () => void
}

const SUGGESTED = ['Why is this true?', 'Give me an example', 'Explain it differently', 'How do I remember this?']

export function QuizTutorPanel({ card, wrongAnswer, onClose }: Props) {
  const { credits, consumeCredits } = useCredits()
  const [halfPerf, setHalfPerf] = useState(false)
  const [history, setHistory] = useState<Message[]>([])
  const [streaming, setStreaming] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [noCreditsError, setNoCreditsError] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset state whenever the card changes
  useEffect(() => {
    setHistory([])
    setStreaming('')
    setUserInput('')
    setNoCreditsError(false)
  }, [card.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, streaming])

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus()
  }, [isLoading])

  const cost = halfPerf ? TUTOR_HALF_COST : TUTOR_FULL_COST

  async function stream(msgs: Message[]) {
    const ok = consumeCredits(cost)
    if (!ok) {
      setNoCreditsError(true)
      return
    }
    setNoCreditsError(false)
    setIsLoading(true)
    setStreaming('')
    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardFront: card.front,
          cardBack: card.back,
          wrongAnswer: wrongAnswer ?? undefined,
          history: msgs,
          halfPerformance: halfPerf,
        }),
      })
      if (!res.ok || !res.body) throw new Error('Failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') continue
          try {
            const parsed = JSON.parse(raw)
            if (parsed.text) { accumulated += parsed.text; setStreaming(accumulated) }
          } catch { /* ignore */ }
        }
      }
      setHistory((prev) => [...prev, { role: 'assistant', content: accumulated }])
      setStreaming('')
    } catch {
      setHistory((prev) => [...prev, { role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const msg = userInput.trim()
    if (!msg || isLoading) return
    const next: Message[] = [...history, { role: 'user', content: msg }]
    setHistory(next)
    setUserInput('')
    stream(next)
  }

  function handleSuggestion(prompt: string) {
    if (isLoading) return
    const next: Message[] = [...history, { role: 'user', content: prompt }]
    setHistory(next)
    stream(next)
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 360, damping: 36 }}
      className="fixed right-0 top-0 h-full w-[400px] max-w-[90vw] z-40 flex flex-col border-l border-[var(--card-border)] bg-[var(--card)] shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--card-border)] shrink-0">
        <div className="flex-1 min-w-0">
          <p className="font-semibold flex items-center gap-1.5 text-sm">
            <span className="text-base">✨</span> AI Tutor
          </p>
          <p className="text-xs text-[var(--muted)] truncate mt-0.5">{card.front}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors text-lg"
        >
          ✕
        </button>
      </div>

      {/* Performance mode toggle */}
      <div className="mx-4 mt-3 shrink-0 flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
        <div className="flex flex-col">
          <span className="text-xs font-medium">{halfPerf ? '⚡ Half Performance' : '✨ Full Performance'}</span>
          <span className="text-[10px] text-[var(--muted)]">{cost} credit{cost !== 1 ? 's' : ''} per message · {credits} left</span>
        </div>
        <button
          onClick={() => setHalfPerf((v) => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${halfPerf ? 'bg-amber-500' : 'bg-[var(--accent)]'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${halfPerf ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {/* Wrong answer context */}
      {wrongAnswer && (
        <div className="mx-4 mt-2 shrink-0 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs">
          <span className="text-red-400">You answered:</span> <span className="text-[var(--foreground)]">&ldquo;{wrongAnswer}&rdquo;</span>
          <br />
          <span className="text-[var(--muted)]">Correct: <strong className="text-[var(--foreground)]">{card.back}</strong></span>
        </div>
      )}

      {/* No credits error */}
      {noCreditsError && (
        <div className="mx-4 mt-2 shrink-0 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
          Not enough credits. Add more from the credits widget or switch to Half Performance ({TUTOR_HALF_COST} credits).
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
        {history.length === 0 && !isLoading && !streaming && (
          <div className="flex justify-start">
            <div className="max-w-[88%] rounded-2xl rounded-bl-sm bg-[var(--background)] border border-[var(--card-border)] px-4 py-2.5 text-sm leading-relaxed">
              {halfPerf ? 'Quick check-in mode — short answers only. What do you need?' : 'I can help!'}
            </div>
          </div>
        )}
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-[var(--accent)] text-white rounded-br-sm'
                : 'bg-[var(--background)] border border-[var(--card-border)] rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {streaming && (
          <div className="flex justify-start">
            <div className="max-w-[88%] rounded-2xl rounded-bl-sm bg-[var(--background)] border border-[var(--card-border)] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
              {streaming}
              <span className="inline-block w-1 h-4 bg-[var(--accent)] align-middle ml-0.5 animate-pulse rounded-full" />
            </div>
          </div>
        )}

        {isLoading && !streaming && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-[var(--background)] border border-[var(--card-border)] px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts — fade out after first user message */}
      <AnimatePresence>
        {history.filter((m) => m.role === 'user').length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0"
          >
            {SUGGESTED.map((p) => (
              <button
                key={p}
                onClick={() => handleSuggestion(p)}
                className="rounded-full border border-[var(--card-border)] bg-[var(--background)] px-3 py-1 text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                {p}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-[var(--card-border)] shrink-0">
        <input
          ref={inputRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask anything about this card…"
          disabled={isLoading}
          className="flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !userInput.trim()}
          className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors active:scale-95"
        >
          Send
        </button>
      </form>
    </motion.div>
  )
}
