'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { bulkInsertCardsAction } from '@/lib/actions'
import { useCredits, CARD_GEN_COST } from '@/components/layout/CreditsContext'

interface GeneratedCard {
  front: string
  back: string
  difficulty: number
}

interface Props {
  setId: string
  onClose: () => void
}

const COUNT_OPTIONS = [5, 10, 20]

export function AIGenerateModal({ setId, onClose }: Props) {
  const { credits, consumeCredits } = useCredits()
  const [content, setContent] = useState('')
  const [count, setCount] = useState(10)
  const [cards, setCards] = useState<GeneratedCard[] | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, startSaveTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    if (!content.trim()) return
    setIsGenerating(true)
    setError(null)
    setCards(null)

    try {
      const res = await fetch('/api/ai/generate-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, count }),
      })

      let data: any
      const text = await res.text()
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(text || 'Generation failed')
      }

      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setCards(data.cards)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  function updateCard(index: number, field: 'front' | 'back', value: string) {
    if (!cards) return
    const next = [...cards]
    next[index] = { ...next[index], [field]: value }
    setCards(next)
  }

  function handleSave() {
    if (!cards) return
    const cardCount = cards.length
    const ok = consumeCredits(cardCount * CARD_GEN_COST)
    if (!ok) {
      setError(`Not enough credits. Saving ${cardCount} cards costs ${cardCount} credit${cardCount !== 1 ? 's' : ''}. You have ${credits}.`)
      return
    }
    startSaveTransition(async () => {
      await bulkInsertCardsAction(setId, cards)
      onClose()
    })
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl"
        >
          <h2 className="mb-1 text-xl font-bold">✨ Generate Cards with AI</h2>
          <p className="mb-1 text-sm text-[var(--muted)]">Paste text, notes, or a topic and Claude will generate flashcards.</p>
          <p className="mb-5 text-xs text-[var(--muted)]">Cost: {CARD_GEN_COST} credit per card saved · You have {credits} credits</p>

          {!cards ? (
            <div className="flex flex-col gap-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your notes, textbook content, or describe the topic..."
                rows={8}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none resize-none"
              />

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Cards to generate:</span>
                <div className="flex gap-2">
                  {COUNT_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(n)}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                        count === n ? 'bg-[var(--accent)] text-white' : 'border border-[var(--card-border)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 rounded-lg border border-[var(--card-border)] py-2 text-sm">Cancel</button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !content.trim()}
                  className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="inline-block"
                      >
                        ✨
                      </motion.span>
                      Generating…
                    </>
                  ) : (
                    '✨ Generate'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-400 font-medium">{cards.length} cards generated — review and edit before saving:</p>
                <p className="text-xs text-[var(--muted)]">Save costs {cards.length} credit{cards.length !== 1 ? 's' : ''}</p>
              </div>

              <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
                {cards.map((card, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-[var(--card-border)] p-3">
                    <textarea
                      value={card.front}
                      onChange={(e) => updateCard(i, 'front', e.target.value)}
                      rows={2}
                      className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1 text-xs resize-none focus:outline-none focus:border-[var(--accent)]"
                    />
                    <textarea
                      value={card.back}
                      onChange={(e) => updateCard(i, 'back', e.target.value)}
                      rows={2}
                      className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1 text-xs resize-none focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                ))}
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setCards(null)} className="flex-1 rounded-lg border border-[var(--card-border)] py-2 text-sm">← Back</button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
                >
                  {isSaving ? 'Saving…' : `Save ${cards.length} Cards (${cards.length} credit${cards.length !== 1 ? 's' : ''})`}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
