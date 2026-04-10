'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateStudySetAction } from '@/lib/actions'
import { CardList } from './CardList'
import { AIGenerateModal } from './AIGenerateModal'
import { CSVImportModal } from './CSVImportModal'
import { SubjectInput } from '@/components/ui/SubjectInput'
import type { Card, StudySet } from '@/types'

interface Props {
  set: StudySet
  cards: Card[]
}

export function SetDetailClient({ set, cards }: Props) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [showCSVModal, setShowCSVModal] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isPublic, setIsPublic] = useState(set.is_public)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formRef.current) return
    const formData = new FormData(formRef.current)
    formData.set('is_public', String(isPublic))
    startTransition(async () => {
      await updateStudySetAction(set.id, formData)
      setIsEditing(false)
      router.refresh()
    })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Set header */}
      <div className="mb-8 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6">
        {isEditing ? (
          <form ref={formRef} onSubmit={handleSave} className="flex flex-col gap-3">
            <input
              name="title"
              defaultValue={set.title}
              required
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-lg font-bold focus:border-[var(--accent)] focus:outline-none"
            />
            <SubjectInput
              name="subject"
              defaultValue={set.subject ?? ''}
              placeholder="Subject"
            />
            <textarea
              name="description"
              defaultValue={set.description ?? ''}
              placeholder="Description"
              rows={2}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm resize-none focus:border-[var(--accent)] focus:outline-none"
            />
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsPublic(!isPublic)}
                className={`relative h-6 w-11 rounded-full transition-colors ${isPublic ? 'bg-[var(--accent)]' : 'bg-[var(--card-border)]'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isPublic ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm">Public</span>
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-sm">Cancel</button>
              <button type="submit" disabled={isPending} className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-60">
                {isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h1 className="text-2xl font-bold">{set.title}</h1>
                {set.subject && (
                  <span className="inline-block mt-1 rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-xs text-[var(--accent)]">{set.subject}</span>
                )}
              </div>
              <button onClick={() => setIsEditing(true)} className="shrink-0 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Edit</button>
            </div>
            {set.description && <p className="text-sm text-[var(--muted)] mb-4">{set.description}</p>}
            <div className="mb-4 flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${set.is_public ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-500'}`}>
                {set.is_public ? 'Public' : 'Private'}
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Edit set
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Link
                href={`/study/${set.id}`}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                ▶ Start Study
              </Link>
              <Link
                href={`/quiz/${set.id}`}
                className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                Quiz Mode
              </Link>
              <button
                onClick={() => setShowAIModal(true)}
                className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                ✨ Generate with AI
              </button>
              <button
                onClick={() => setShowCSVModal(true)}
                className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                📋 Import CSV
              </button>
            </div>
          </>
        )}
      </div>

      {/* Cards */}
      <CardList cards={cards} setId={set.id} />

      {showAIModal && (
        <AIGenerateModal setId={set.id} onClose={() => setShowAIModal(false)} />
      )}

      {showCSVModal && (
        <CSVImportModal setId={set.id} onClose={() => setShowCSVModal(false)} />
      )}
    </div>
  )
}
