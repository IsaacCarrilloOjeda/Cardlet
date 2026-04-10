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

// Split a single CSV line honoring double-quoted fields.
function splitCSVLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } // escaped quote
        else inQuotes = false
      } else {
        cur += ch
      }
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ',') { out.push(cur); cur = '' }
      else cur += ch
    }
  }
  out.push(cur)
  return out
}

function parseInput(raw: string): ParsedCard[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const cards: ParsedCard[] = []
  for (const line of lines) {
    let front = ''
    let back = ''
    if (line.includes('\t')) {
      const parts = line.split('\t')
      front = parts[0]?.trim() ?? ''
      back = parts.slice(1).join('\t').trim()
    } else if (line.includes(',')) {
      const parts = splitCSVLine(line)
      front = parts[0]?.trim() ?? ''
      back = parts.slice(1).join(',').trim()
    } else {
      continue
    }
    if (front && back) cards.push({ front, back, difficulty: 3 })
  }
  return cards
}

export function CSVImportModal({ setId, onClose }: Props) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const preview = parseInput(text)

  function handleImport() {
    setError(null)
    if (preview.length === 0) {
      setError('No valid rows found. Use front<tab>back or front,back per line.')
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
        className="w-full max-w-2xl rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Import from CSV / Paste</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              One card per line. Separate front and back with a <kbd className="rounded bg-[var(--background)] px-1 py-0.5 text-[10px] border border-[var(--card-border)]">Tab</kbd> or comma.
              Paste directly from Excel / Google Sheets.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'hello\tworld\nfoo,bar\n"a, b","definition here"'}
          rows={10}
          className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 font-mono text-xs focus:border-[var(--accent)] focus:outline-none"
        />

        {text && (
          <div className="mt-3 text-xs text-[var(--muted)]">
            Preview: <strong className="text-[var(--foreground)]">{preview.length}</strong> card{preview.length === 1 ? '' : 's'} detected
          </div>
        )}

        {preview.length > 0 && (
          <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-[var(--card-border)] bg-[var(--background)]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[var(--card)]">
                <tr className="text-left text-[var(--muted)]">
                  <th className="px-2 py-1 font-medium">Front</th>
                  <th className="px-2 py-1 font-medium">Back</th>
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
