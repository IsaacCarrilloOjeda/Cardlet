'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCredits, IMAGE_OCR_COST } from '@/components/layout/CreditsContext'

interface Props {
  open: boolean
  onClose: () => void
  onTranscribed: (text: string, kind: 'text' | 'equation' | 'mixed') => void
  /** Optional override label for the confirm action */
  confirmLabel?: string
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function SnapPhotoModal({ open, onClose, onTranscribed, confirmLabel = 'Use Transcription' }: Props) {
  const { credits, consumeCredits } = useCredits()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [text, setText] = useState<string | null>(null)
  const [kind, setKind] = useState<'text' | 'equation' | 'mixed'>('text')
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setPreviewUrl(null)
    setText(null)
    setKind('text')
    setError(null)
    setIsTranscribing(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleFile(file: File | null) {
    if (!file) return
    setError(null)

    if (credits < IMAGE_OCR_COST) {
      setError(`Photo OCR costs ${IMAGE_OCR_COST} credits. You have ${credits}.`)
      return
    }

    const dataUrl = await fileToBase64(file)
    setPreviewUrl(dataUrl)

    if (!consumeCredits(IMAGE_OCR_COST)) {
      setError('Could not consume credits.')
      return
    }

    setIsTranscribing(true)
    try {
      const res = await fetch('/api/ai/transcribe-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl, mimeType: file.type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Transcription failed')
      setText(data.text)
      setKind(data.kind ?? 'text')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed')
    } finally {
      setIsTranscribing(false)
    }
  }

  function handleConfirm() {
    if (!text) return
    onTranscribed(text, kind)
    reset()
    onClose()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { reset(); onClose() }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">📸 Snap a Photo</h2>
            <button onClick={() => { reset(); onClose() }} className="text-[var(--muted)] hover:text-[var(--foreground)]" aria-label="Close">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <p className="mb-4 text-xs text-[var(--muted)]">
            Photo OCR · {IMAGE_OCR_COST} credits per image · You have {credits}
          </p>

          {!previewUrl && (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-[var(--card-border)] hover:border-[var(--accent)] bg-[var(--background)] px-6 py-12 text-center transition-colors"
            >
              <div className="text-3xl mb-2">📷</div>
              <p className="text-sm font-semibold">Tap to take or upload a photo</p>
              <p className="text-[11px] text-[var(--muted)] mt-1">Textbook page · handwritten notes · equations</p>
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />

          {previewUrl && (
            <div className="flex flex-col gap-3">
              <div className="relative rounded-xl overflow-hidden border border-[var(--card-border)] bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-contain" />
              </div>

              {isTranscribing && (
                <div className="text-center text-sm text-[var(--muted)] py-4">
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="inline-block mr-2">⏳</motion.span>
                  Transcribing image…
                </div>
              )}

              {text !== null && !isTranscribing && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-[var(--muted)]">Transcription</p>
                    <span className="text-[10px] rounded-full bg-[var(--accent)]/20 text-[var(--accent)] px-2 py-0.5 font-bold uppercase">{kind}</span>
                  </div>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-xs font-mono focus:border-[var(--accent)] focus:outline-none resize-none"
                  />
                  <p className="mt-1 text-[10px] text-[var(--muted)]">⚠️ AI OCR can make mistakes — review before using.</p>
                </div>
              )}
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <div className="mt-4 flex gap-3">
            <button onClick={() => { reset(); onClose() }} className="flex-1 rounded-lg border border-[var(--card-border)] py-2 text-sm">
              Cancel
            </button>
            {previewUrl && !text && !isTranscribing && (
              <button onClick={reset} className="flex-1 rounded-lg border border-[var(--card-border)] py-2 text-sm">
                Re-take
              </button>
            )}
            {text && (
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                {confirmLabel}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
