'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { deleteStudySetAction } from '@/lib/actions'
import type { StudySet } from '@/types'

interface Props {
  set: StudySet
}

export function StudySetCard({ set }: Props) {
  const [isPending, startTransition] = useTransition()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleDelete() {
    setMenuOpen(false)
    if (!confirm(`Delete "${set.title}"? This cannot be undone.`)) return
    startTransition(async () => {
      await deleteStudySetAction(set.id)
    })
  }

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`group relative rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] flex flex-col h-36 transition-border-color hover:border-[var(--accent)]/50 ${isPending ? 'opacity-50' : ''}`}
    >
      {/* Clickable card body → go to set detail */}
      <Link href={`/sets/${set.id}`} className="flex-1 flex flex-col p-4 min-h-0">
        <h3 className="font-bold text-sm text-[var(--foreground)] line-clamp-2 leading-snug mb-1.5">
          {set.title}
        </h3>
        <p className="text-[var(--muted)] text-xs">
          {set.card_count ?? 0} {set.card_count === 1 ? 'term' : 'terms'}
        </p>
      </Link>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--card-border)]">
        {set.subject ? (
          <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
            {set.subject}
          </span>
        ) : (
          <span />
        )}

        {/* Overflow menu */}
        <div className="relative">
          <button
            onClick={(e) => { e.preventDefault(); setMenuOpen((o) => !o) }}
            className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-all"
            aria-label="Options"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  transition={{ duration: 0.1 }}
                  className="absolute bottom-full right-0 mb-1 w-36 rounded-xl border border-[var(--card-border)] bg-[var(--surface-raised)] shadow-xl z-20 py-1"
                >
                  <Link
                    href={`/sets/${set.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--foreground)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View set
                  </Link>
                  <Link
                    href={`/study/${set.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--foreground)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Study
                  </Link>
                  <div className="h-px bg-[var(--card-border)] my-1" />
                  <button
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
