'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCredits, TUTOR_FULL_COST, TUTOR_HALF_COST } from '@/components/layout/CreditsContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  cardFront: string
  cardBack: string
  wrongAnswer?: string
  onClose: () => void
}

export function AITutorChat({ cardFront, cardBack, wrongAnswer, onClose }: Props) {
  const { credits, consumeCredits } = useCredits()
  const [halfPerf, setHalfPerf] = useState(false)
  const [history, setHistory] = useState<Message[]>([])
  const [streaming, setStreaming] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [noCreditsError, setNoCreditsError] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, streaming])

  const cost = halfPerf ? TUTOR_HALF_COST : TUTOR_FULL_COST

  async function sendMessage(userMessage: string | undefined) {
    const msgs: Message[] = userMessage
      ? [...history, { role: 'user', content: userMessage }]
      : history

    // Deduct credits before sending
    const ok = consumeCredits(cost)
    if (!ok) {
      setNoCreditsError(true)
      return
    }
    setNoCreditsError(false)

    if (userMessage) {
      setHistory(msgs)
      setUserInput('')
    }

    setIsLoading(true)
    setStreaming('')

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardFront,
          cardBack,
          wrongAnswer,
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
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') continue
          try {
            const parsed = JSON.parse(raw)
            if (parsed.text) {
              accumulated += parsed.text
              setStreaming(accumulated)
            }
          } catch {
            // ignore
          }
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
    if (!userInput.trim() || isLoading) return
    sendMessage(userInput.trim())
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="relative w-full max-w-lg rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--card-border)] shrink-0">
            <div>
              <h3 className="font-semibold">✨ AI Tutor</h3>
              <p className="text-xs text-[var(--muted)] mt-0.5 truncate max-w-72">{cardFront}</p>
            </div>
            <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-xl leading-none">&times;</button>
          </div>

          {/* Performance mode toggle */}
          <div className="mx-5 mt-3 shrink-0 flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <div className="flex flex-col">
              <span className="text-xs font-medium">{halfPerf ? '⚡ Half Performance' : '✨ Full Performance'}</span>
              <span className="text-[10px] text-[var(--muted)]">{cost} credits per message · {credits} left</span>
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

          {/* Context pill */}
          {wrongAnswer && (
            <div className="mx-5 mt-2 shrink-0 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
              Your answer: &ldquo;{wrongAnswer}&rdquo; → Correct: &ldquo;{cardBack}&rdquo;
            </div>
          )}

          {/* No credits error */}
          {noCreditsError && (
            <div className="mx-5 mt-2 shrink-0 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
              Not enough credits. Add more from the credits widget or switch to Half Performance ({TUTOR_HALF_COST} credits).
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 min-h-0">
            {history.length === 0 && !isLoading && !streaming && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-[var(--background)] border border-[var(--card-border)] px-4 py-2.5 text-sm">
                  {halfPerf ? 'Quick check-in mode — I\'ll keep answers short. What do you need?' : 'I can help! What would you like to know?'}
                </div>
              </div>
            )}
            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-[var(--accent)] text-white rounded-br-sm'
                      : 'bg-[var(--background)] border border-[var(--card-border)] rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Streaming */}
            {streaming && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-[var(--background)] border border-[var(--card-border)] px-4 py-2.5 text-sm">
                  {streaming}
                  <span className="inline-block w-1.5 h-4 bg-current align-middle ml-0.5 animate-pulse" />
                </div>
              </div>
            )}

            {/* Loading dots */}
            {isLoading && !streaming && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-[var(--background)] border border-[var(--card-border)] px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--muted)]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-[var(--card-border)] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--card-border)] px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors shrink-0"
              aria-label="Close tutor"
            >
              ← Back
            </button>
            <input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask a follow-up question…"
              disabled={isLoading}
              className="flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors"
            >
              Send
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
