'use client'

import { useState, useRef, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { updateStudySetAction, duplicateStudySetAction } from '@/lib/actions'
import { CardList } from './CardList'
import { AIGenerateModal } from './AIGenerateModal'
import { CSVImportModal } from './CSVImportModal'
import { PdfImportModal } from './PdfImportModal'
import { PracticeExamModal } from './PracticeExamModal'
import { SubjectInput } from '@/components/ui/SubjectInput'
import { SetRatings } from './SetRatings'
import type { Card, StudySet, SetRating } from '@/types'

interface Props {
  set: StudySet
  cards: Card[]
  isOwner?: boolean
  isGuest?: boolean
  ratings?: SetRating[]
  currentUserId?: string
}

export function SetDetailClient({ set, cards, isOwner = true, isGuest = false, ratings = [], currentUserId }: Props) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [showCSVModal, setShowCSVModal] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [showExamModal, setShowExamModal] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isPublic, setIsPublic] = useState(set.is_public)
  const formRef = useRef<HTMLFormElement>(null)

  const noModals = !showAIModal && !showCSVModal && !showPdfModal && !showExamModal
  const shortcuts = useMemo(() => ({
    s: () => { if (!isGuest) router.push(`/study/${set.id}`) },
    q: () => { if (!isGuest) router.push(`/quiz/${set.id}`) },
    e: () => { if (isOwner) setIsEditing(true) },
  }), [router, set.id, isGuest, isOwner])
  useKeyboardShortcuts(shortcuts, { enabled: !isEditing && noModals })

  async function handleDuplicate() {
    setIsDuplicating(true)
    try {
      const { id } = await duplicateStudySetAction(set.id)
      router.push(`/sets/${id}`)
    } finally {
      setIsDuplicating(false)
    }
  }

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
        {isEditing && isOwner ? (
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
            {/* Guest banner */}
            {isGuest && (
              <div className="mb-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 flex items-center justify-between gap-4">
                <p className="text-sm text-[var(--foreground)]">
                  Sign in to study, track progress, and copy this set.
                </p>
                <Link
                  href="/login"
                  className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Sign in free
                </Link>
              </div>
            )}

            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h1 className="text-2xl font-bold">{set.title}</h1>
                {set.subject && (
                  <span className="inline-block mt-1 rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-xs text-[var(--accent)]">{set.subject}</span>
                )}
              </div>
              {isOwner && (
                <button onClick={() => setIsEditing(true)} className="shrink-0 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Edit</button>
              )}
            </div>
            {set.description && <p className="text-sm text-[var(--muted)] mb-4">{set.description}</p>}
            <div className="mb-4 flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${set.is_public ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-500'}`}>
                {set.is_public ? 'Public' : 'Private'}
              </span>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Edit set
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              {isGuest ? (
                <Link
                  href="/login"
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
                >
                  ▶ Sign in to Study
                </Link>
              ) : (
                <>
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
                </>
              )}
              {set.is_public && (
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/sets/${set.id}`
                    const title = set.title
                    const body = set.description
                      ? `${set.description}\n\n${url}`
                      : `Study set on Cardlet: ${url}`
                    const shareUrl =
                      `https://classroom.google.com/share` +
                      `?url=${encodeURIComponent(url)}` +
                      `&title=${encodeURIComponent(title)}` +
                      `&body=${encodeURIComponent(body)}`
                    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=700')
                  }}
                  title="Share to Google Classroom"
                  className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    <circle cx="12" cy="11" r="2.5" />
                    <path d="M8.5 17c.5-1.8 2-3 3.5-3s3 1.2 3.5 3" />
                  </svg>
                  Share to Classroom
                </button>
              )}
              {isOwner && (
                <>
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
                  <button
                    onClick={() => setShowPdfModal(true)}
                    className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                  >
                    📄 Import PDF
                  </button>
                  <button
                    onClick={() => setShowExamModal(true)}
                    disabled={cards.length < 3}
                    className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-40"
                  >
                    📝 Practice Exam
                  </button>
                  <button
                    onClick={handleDuplicate}
                    disabled={isDuplicating}
                    className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-60 flex items-center gap-1.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    {isDuplicating ? 'Duplicating…' : 'Duplicate Set'}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Cards */}
      <CardList cards={cards} setId={set.id} />

      {/* Ratings & Reviews — shown for public sets */}
      {set.is_public && (
        <SetRatings ratings={ratings} setId={set.id} currentUserId={currentUserId} />
      )}

      {showAIModal && (
        <AIGenerateModal setId={set.id} onClose={() => setShowAIModal(false)} />
      )}

      {showCSVModal && (
        <CSVImportModal setId={set.id} onClose={() => setShowCSVModal(false)} />
      )}

      {showPdfModal && (
        <PdfImportModal setId={set.id} onClose={() => setShowPdfModal(false)} />
      )}

      {showExamModal && (
        <PracticeExamModal setId={set.id} onClose={() => setShowExamModal(false)} />
      )}
    </div>
  )
}
