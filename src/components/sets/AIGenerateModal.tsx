'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { bulkInsertCardsAction } from '@/lib/actions'
import { useCredits, CARD_GEN_COST, AUTO_SPLIT_COST } from '@/components/layout/CreditsContext'
import { SnapPhotoModal } from './SnapPhotoModal'

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
  const [snapOpen, setSnapOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceUnsupported, setVoiceUnsupported] = useState(false)
  const recognitionRef = useRef<unknown>(null)

  // Set up Web Speech API once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const SR = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    if (!SR) {
      setVoiceUnsupported(true)
      return
    }
    type SREvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> }
    type SRInstance = {
      continuous: boolean
      interimResults: boolean
      lang: string
      onresult: ((e: SREvent) => void) | null
      onerror: (() => void) | null
      onend: (() => void) | null
      start: () => void
      stop: () => void
    }
    const Ctor = SR as new () => SRInstance
    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e: SREvent) => {
      let chunk = ''
      for (let i = 0; i < e.results.length; i++) {
        chunk += e.results[i][0].transcript
      }
      setContent((c) => (c ? c + ' ' : '') + chunk)
    }
    rec.onerror = () => setIsListening(false)
    rec.onend = () => setIsListening(false)
    recognitionRef.current = rec
  }, [])

  function toggleVoice() {
    const rec = recognitionRef.current as { start: () => void; stop: () => void } | null
    if (!rec) return
    if (isListening) {
      rec.stop()
      setIsListening(false)
    } else {
      try {
        rec.start()
        setIsListening(true)
      } catch {
        // already started
      }
    }
  }

  async function handleAutoSplit() {
    if (!content.trim()) return
    if (!consumeCredits(AUTO_SPLIT_COST)) {
      setError(`Not enough credits. Auto-split costs ${AUTO_SPLIT_COST}.`)
      return
    }
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/auto-split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Auto-split failed')
      if (Array.isArray(data.cards) && data.cards.length > 0) setCards(data.cards)
      else setError('No clear term/definition pairs detected. Try Generate instead.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auto-split failed')
    } finally {
      setIsGenerating(false)
    }
  }

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
          <h2 className="mb-1 text-xl font-bold">Generate Cards with AI</h2>
          <p className="mb-1 text-sm text-[var(--muted)]">Paste text, notes, or a topic and Claude will generate flashcards.</p>
          <p className="mb-5 text-xs text-[var(--muted)]">Cost: {CARD_GEN_COST} credit per card saved · You have {credits} credits</p>

          {!cards ? (
            <div className="flex flex-col gap-4">
              {/* Source picker — Photo / Voice / Auto-split */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSnapOpen(true)}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--card-border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium hover:border-[var(--accent)] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  From Photo
                </button>
                {!voiceUnsupported && (
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      isListening
                        ? 'bg-red-500 text-white border border-red-500'
                        : 'border border-[var(--card-border)] bg-[var(--background)] hover:border-[var(--accent)]'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-current animate-pulse inline-block"/>
                        Listening…
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="2" width="6" height="12" rx="3"/>
                          <path d="M19 10a7 7 0 01-14 0M12 19v3M8 22h8"/>
                        </svg>
                        Voice
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAutoSplit}
                  disabled={!content.trim() || isGenerating}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--card-border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium hover:border-[var(--accent)] transition-colors disabled:opacity-40"
                  title="Detect existing term: definition pairs in your text"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="6" cy="6" r="3"/>
                    <circle cx="6" cy="18" r="3"/>
                    <line x1="20" y1="4" x2="8.12" y2="15.88"/>
                    <line x1="14.47" y1="14.48" x2="20" y2="20"/>
                    <line x1="8.12" y1="8.12" x2="12" y2="12"/>
                  </svg>
                  Auto-split ({AUTO_SPLIT_COST})
                </button>
              </div>

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
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M21 12a9 9 0 01-9 9" opacity="0.35"/>
                          <path d="M12 3a9 9 0 019 9"/>
                        </svg>
                      </motion.span>
                      Generating…
                    </>
                  ) : (
                    'Generate'
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
        <SnapPhotoModal
          open={snapOpen}
          onClose={() => setSnapOpen(false)}
          onTranscribed={(text) => {
            setContent((c) => (c ? c + '\n\n' : '') + text)
          }}
          confirmLabel="Add to Notes"
        />
      </div>
    </AnimatePresence>
  )
}
