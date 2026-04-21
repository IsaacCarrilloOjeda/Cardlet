'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { bulkInsertCardsAction } from '@/lib/actions'

interface Props {
  setId: string
  onClose: () => void
}

interface ParsedCard {
  front: string
  back: string
  difficulty: number
}

const MAX_IMPORT = 500
const WARN_OVER = 200

// Strip Quizlet-specific audio and image tokens that won't render anywhere useful.
function cleanToken(raw: string): string {
  return raw
    .replace(/^\s*\*\s+/, '') // leading "* " audio marker
    .replace(/\[image[^\]]*\]/gi, '')
    .replace(/\[audio[^\]]*\]/gi, '')
    .trim()
}

function parseQuizlet(raw: string): ParsedCard[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return []

  const anyTab = lines.some((l) => l.includes('\t'))
  const cards: ParsedCard[] = []

  for (const line of lines) {
    let front = ''
    let back = ''

    if (anyTab) {
      const i = line.indexOf('\t')
      if (i < 0) continue
      front = line.slice(0, i)
      back = line.slice(i + 1).replace(/\t/g, ' ')
    } else {
      // Fallback: first comma splits. Quizlet's CSV export is naive (no quoting).
      const i = line.indexOf(',')
      if (i < 0) continue
      front = line.slice(0, i)
      back = line.slice(i + 1)
    }

    front = cleanToken(front)
    back = cleanToken(back)
    if (front && back) cards.push({ front, back, difficulty: 3 })
    if (cards.length >= MAX_IMPORT) break
  }

  return cards
}

export function QuizletImportModal({ setId, onClose }: Props) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)

  const preview = parseQuizlet(text)
  const truncated = preview.length >= MAX_IMPORT

  function handleImport() {
    setError(null)
    if (preview.length === 0) {
      setError("No cards detected. Each line needs a term and a definition separated by a Tab (or comma).")
      return
    }
    startTransition(async () => {
      try {
        await bulkInsertCardsAction(setId, preview)
        router.refresh()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to import cards.')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Import from Quizlet</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Paste the exported text below. Up to {MAX_IMPORT} cards at a time.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowInstructions((v) => !v)}
          className="w-full text-left rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-3 py-2 text-xs text-[var(--foreground)] flex items-start gap-2 hover:bg-[var(--accent)]/10 transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 mt-0.5 transition-transform ${showInstructions ? 'rotate-90' : ''}`}
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="flex-1">
            <strong>Quizlet blocks direct URL imports.</strong> Click to see how to export.
          </span>
        </button>

        {showInstructions && (
          <ol className="mt-2 ml-6 list-decimal text-xs text-[var(--muted)] space-y-1">
            <li>Open the Quizlet set in a browser.</li>
            <li>
              Click the <strong className="text-[var(--foreground)]">···</strong> menu →{' '}
              <strong className="text-[var(--foreground)]">Export</strong>.
            </li>
            <li>
              Set <em>between term and definition</em> to{' '}
              <kbd className="rounded bg-[var(--background)] px-1 py-0.5 text-[10px] border border-[var(--card-border)]">Tab</kbd>{' '}
              and <em>between rows</em> to{' '}
              <kbd className="rounded bg-[var(--background)] px-1 py-0.5 text-[10px] border border-[var(--card-border)]">New line</kbd>.
            </li>
            <li>Copy the text box contents and paste below.</li>
          </ol>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'photosynthesis\tprocess by which plants convert light to chemical energy\nmitochondria\tthe powerhouse of the cell'}
          rows={10}
          className="mt-4 w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 font-mono text-xs focus:border-[var(--accent)] focus:outline-none"
        />

        {text && (
          <div className="mt-3 text-xs text-[var(--muted)]">
            Preview: <strong className="text-[var(--foreground)]">{preview.length}</strong> card
            {preview.length === 1 ? '' : 's'} detected
            {truncated && (
              <span className="ml-2 text-orange-400">
                (capped at {MAX_IMPORT} — split the rest into another import)
              </span>
            )}
          </div>
        )}

        {preview.length > WARN_OVER && !truncated && (
          <div className="mt-2 rounded-lg border border-orange-500/30 bg-orange-500/5 px-3 py-2 text-xs text-orange-300">
            Large import ({preview.length} cards). The insert may take a few seconds.
          </div>
        )}

        {preview.length > 0 && (
          <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-[var(--card-border)] bg-[var(--background)]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[var(--card)]">
                <tr className="text-left text-[var(--muted)]">
                  <th className="px-2 py-1 font-medium">Term</th>
                  <th className="px-2 py-1 font-medium">Definition</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((c, i) => (
                  <tr key={i} className="border-t border-[var(--card-border)]">
                    <td className="px-2 py-1">{c.front}</td>
                    <td className="px-2 py-1 text-[var(--muted)]">{c.back}</td>
                  </tr>
                ))}
                {preview.length > 20 && (
                  <tr>
                    <td colSpan={2} className="px-2 py-1 text-center text-[var(--muted)]">
                      …and {preview.length - 20} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm hover:border-[var(--foreground)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isPending || preview.length === 0}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {isPending ? 'Importing…' : `Import ${preview.length || ''} card${preview.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
