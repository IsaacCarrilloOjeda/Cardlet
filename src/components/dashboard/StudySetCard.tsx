'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { motion } from 'framer-motion'
import { deleteStudySetAction } from '@/lib/actions'
import type { StudySet } from '@/types'

interface Props {
  set: StudySet
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function StudySetCard({ set }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Delete "${set.title}"? This cannot be undone.`)) return
    startTransition(async () => {
      await deleteStudySetAction(set.id)
    })
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 flex flex-col gap-3 ${isPending ? 'opacity-50' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{set.title}</h3>
          {set.subject && (
            <span className="inline-block mt-1 rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-xs text-[var(--accent)]">
              {set.subject}
            </span>
          )}
        </div>
        {set.is_public && (
          <span className="shrink-0 text-xs text-[var(--muted)] border border-[var(--card-border)] rounded px-1.5 py-0.5">Public</span>
        )}
      </div>

      {/* Description */}
      {set.description && (
        <p className="text-sm text-[var(--muted)] line-clamp-2">{set.description}</p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
        <span>{set.card_count ?? 0} cards</span>
        <span>·</span>
        <span>{formatDate(set.created_at)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-[var(--card-border)]">
        <Link
          href={`/sets/${set.id}`}
          className="flex-1 rounded-lg bg-[var(--accent)] px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          Study
        </Link>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:border-red-500"
        >
          {isPending ? '…' : 'Delete'}
        </button>
      </div>
    </motion.div>
  )
}
