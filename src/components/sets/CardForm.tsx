'use client'

import { useRef, useState, useTransition } from 'react'
import { createCardAction, updateCardAction } from '@/lib/actions'
import type { Card } from '@/types'

interface Props {
  setId: string
  card?: Card
  onDone: () => void
  onCancel?: () => void
}

const DIFFICULTIES = [
  { value: 1, label: 'Easy' },
  { value: 3, label: 'Medium' },
  { value: 5, label: 'Hard' },
]

export function CardForm({ setId, card, onDone, onCancel }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [difficulty, setDifficulty] = useState(card?.difficulty ?? 3)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formRef.current) return
    const formData = new FormData(formRef.current)
    formData.set('difficulty', String(difficulty))

    setError(null)
    startTransition(async () => {
      try {
        if (card) {
          await updateCardAction(card.id, setId, formData)
        } else {
          await createCardAction(setId, formData)
          formRef.current?.reset()
          setDifficulty(3)
        }
        onDone()
      } catch {
        setError('Failed to save card.')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Front</label>
          <textarea
            name="front"
            required
            defaultValue={card?.front}
            rows={3}
            placeholder="Question / term"
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none resize-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Back</label>
          <textarea
            name="back"
            required
            defaultValue={card?.back}
            rows={3}
            placeholder="Answer / definition"
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-[var(--muted)]">Difficulty:</span>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDifficulty(d.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                difficulty === d.value
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--card-border)] hover:border-[var(--accent)]'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-sm hover:border-[var(--accent)]"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {isPending ? 'Saving…' : card ? 'Save Changes' : 'Add Card'}
        </button>
      </div>
    </form>
  )
}
