'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createStudySetAction } from '@/lib/actions'

interface Props {
  onClose: () => void
  defaultSubject?: string
}

export function CreateSetModal({ onClose, defaultSubject }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [isPublic, setIsPublic] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formRef.current) return
    const formData = new FormData(formRef.current)
    formData.set('is_public', String(isPublic))

    setError(null)
    startTransition(async () => {
      try {
        const { id } = await createStudySetAction(formData)
        onClose()
        router.push(`/sets/${id}`)
      } catch {
        setError('Failed to create set. Please try again.')
      }
    })
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl"
        >
          <h2 className="mb-5 text-xl font-bold">Create Study Set</h2>

          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Title *</label>
              <input
                name="title"
                required
                placeholder="e.g. Biology Chapter 5"
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Subject</label>
              <input
                name="subject"
                defaultValue={defaultSubject ?? ''}
                placeholder="e.g. Biology, History, Math"
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Optional description"
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none resize-none"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <div
                onClick={() => setIsPublic(!isPublic)}
                className={`relative h-6 w-11 rounded-full transition-colors ${isPublic ? 'bg-[var(--accent)]' : 'bg-[var(--card-border)]'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isPublic ? 'translate-x-5' : ''}`}
                />
              </div>
              <span className="text-sm">Make public</span>
            </label>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--accent)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
              >
                {isPending ? 'Creating…' : 'Create Set'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
