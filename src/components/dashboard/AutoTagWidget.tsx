'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateStudySetAction } from '@/lib/actions'
import type { StudySet } from '@/types'

interface Suggestion {
  id: string
  subject: string
}

interface Props {
  sets: StudySet[]
}

export function AutoTagWidget({ sets }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const untagged = sets.filter((s) => !s.subject)
  if (untagged.length === 0) return null

  async function handleScan() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/auto-tag', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setSuggestions(data.suggestions ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleApply() {
    if (!suggestions) return
    setApplying(true)
    try {
      for (const sug of suggestions) {
        const set = sets.find((s) => s.id === sug.id)
        if (!set) continue
        const fd = new FormData()
        fd.set('title', set.title)
        fd.set('description', set.description ?? '')
        fd.set('subject', sug.subject)
        fd.set('is_public', String(set.is_public))
        await updateStudySetAction(set.id, fd)
      }
      setSuggestions(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏷️</span>
          <div>
            <p className="text-sm font-semibold">{untagged.length} untagged {untagged.length === 1 ? 'set' : 'sets'}</p>
            <p className="text-[11px] text-[var(--muted)]">Let AI suggest subjects so you can sort by folder.</p>
          </div>
        </div>
        {!suggestions && (
          <button
            onClick={handleScan}
            disabled={loading}
            className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {loading ? 'Scanning…' : '✨ Suggest Subjects'}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {suggestions && suggestions.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {suggestions.map((sug) => {
            const set = sets.find((s) => s.id === sug.id)
            if (!set) return null
            return (
              <div key={sug.id} className="flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-xs">
                <span className="truncate flex-1">{set.title}</span>
                <span className="ml-2 rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[var(--accent)] font-medium">{sug.subject}</span>
              </div>
            )
          })}
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              disabled={applying}
              className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {applying ? 'Applying…' : `Apply all (${suggestions.length})`}
            </button>
            <button
              onClick={() => setSuggestions(null)}
              className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {suggestions && suggestions.length === 0 && (
        <p className="mt-2 text-xs text-[var(--muted)]">No suggestions returned.</p>
      )}
    </div>
  )
}
