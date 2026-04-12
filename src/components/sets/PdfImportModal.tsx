'use client'

import { useRef, useState, useTransition } from 'react'
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

const COUNT_OPTIONS = [10, 15, 20, 30]

async function extractPdfText(file: File): Promise<{ text: string; pages: number }> {
  // Lazy-load pdfjs only when the user actually opens this modal
  const pdfjs = await import('pdfjs-dist')
  // Pin worker to the exact installed version via CDN — avoids bundler-specific worker setup
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

  const buf = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buf }).promise
  const parts: string[] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((it) => ('str' in it ? (it as { str: string }).str : ''))
      .join(' ')
    parts.push(pageText)
  }
  return { text: parts.join('\n\n').trim(), pages: doc.numPages }
}

export function PdfImportModal({ setId, onClose }: Props) {
  const { credits, consumeCredits } = useCredits()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [count, setCount] = useState(15)
  const [cards, setCards] = useState<GeneratedCard[] | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, startSaveTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleFile(f: File | null) {
    if (!f) return
    setError(null)
    setFile(f)
    setExtractedText(null)
    setCards(null)
    setIsExtracting(true)
    try {
      const { text, pages } = await extractPdfText(f)
      if (!text) {
        throw new Error('No text found in this PDF (it may be a scanned image).')
      }
      setExtractedText(text)
      setPageCount(pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read PDF')
      setFile(null)
    } finally {
      setIsExtracting(false)
    }
  }

  async function handleGenerate() {
    if (!extractedText) return
    setError(null)
    setIsGenerating(true)
    try {
      const res = await fetch('/api/ai/pdf-to-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractedText, count }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      if (!Array.isArray(data.cards) || data.cards.length === 0) {
        throw new Error('No cards generated')
      }
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
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold">📄 Import from PDF</h2>
            <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)]" aria-label="Close">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mb-1 text-sm text-[var(--muted)]">Upload a text-based PDF and Claude will turn it into flashcards.</p>
          <p className="mb-5 text-xs text-[var(--muted)]">Cost: {CARD_GEN_COST} credit per card saved · You have {credits} credits</p>

          {!cards ? (
            <div className="flex flex-col gap-4">
              {!file && (
                <button
                  onClick={() => inputRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-[var(--card-border)] hover:border-[var(--accent)] bg-[var(--background)] px-6 py-12 text-center transition-colors"
                >
                  <div className="text-3xl mb-2">📄</div>
                  <p className="text-sm font-semibold">Tap to choose a PDF</p>
                  <p className="text-[11px] text-[var(--muted)] mt-1">Lecture notes · textbook chapter · study guide</p>
                </button>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />

              {isExtracting && (
                <div className="text-center text-sm text-[var(--muted)] py-4">
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="inline-block mr-2">⏳</motion.span>
                  Reading PDF…
                </div>
              )}

              {file && extractedText && !isExtracting && (
                <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <button
                      onClick={() => { setFile(null); setExtractedText(null) }}
                      className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] underline shrink-0 ml-2"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--muted)]">
                    {pageCount} page{pageCount !== 1 ? 's' : ''} · {extractedText.length.toLocaleString()} characters extracted
                    {extractedText.length > 12000 && ' (will trim to 12,000)'}
                  </p>
                </div>
              )}

              {file && extractedText && (
                <div className="flex items-center gap-3 flex-wrap">
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
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 rounded-lg border border-[var(--card-border)] py-2 text-sm">Cancel</button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !extractedText}
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
                    '✨ Generate Cards'
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
