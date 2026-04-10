'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { deleteCardAction } from '@/lib/actions'
import { CardForm } from './CardForm'
import { SpeakButton } from '@/components/study/SpeakButton'
import type { Card } from '@/types'

const DIFFICULTY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Easy', color: 'text-green-500' },
  2: { label: 'Easy', color: 'text-green-500' },
  3: { label: 'Medium', color: 'text-yellow-500' },
  4: { label: 'Hard', color: 'text-red-500' },
  5: { label: 'Hard', color: 'text-red-500' },
}

interface Props {
  card: Card
  setId: string
  index: number
}

export function CardPreview({ card, setId, index }: Props) {
  const router = useRouter()
  const [isFlipped, setIsFlipped] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const diff = DIFFICULTY_LABELS[card.difficulty] ?? DIFFICULTY_LABELS[3]

  function handleDelete() {
    if (!confirm('Delete this card?')) return
    startTransition(async () => {
      await deleteCardAction(card.id, setId)
      router.refresh()
    })
  }

  if (isEditing) {
    return (
      <CardForm
        setId={setId}
        card={card}
        onDone={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <div className={`group relative rounded-xl border border-[var(--card-border)] bg-[var(--card)] ${isPending ? 'opacity-50' : ''}`}>
      {/* Card number */}
      <span className="absolute left-4 top-3 text-xs text-[var(--muted)]">#{index + 1}</span>

      {/* Difficulty */}
      <span className={`absolute right-4 top-3 text-xs font-medium ${diff.color}`}>{diff.label}</span>

      {/* Flip area */}
      <button
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full text-left p-4 pt-8"
        style={{ perspective: 600 }}
        aria-label="Flip card"
      >
        <motion.div
          animate={{ rotateX: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 30 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative min-h-[4rem]"
        >
          {/* Front */}
          <div style={{ backfaceVisibility: 'hidden' }} className="absolute inset-0">
            <p className="text-sm font-medium">{card.front}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Click to see answer</p>
          </div>
          {/* Back */}
          <div style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }} className="absolute inset-0">
            <p className="text-sm text-[var(--muted)]">{card.back}</p>
          </div>
        </motion.div>
      </button>

      {/* Actions */}
      <div className="flex justify-end items-center gap-2 border-t border-[var(--card-border)] px-2 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <SpeakButton text={isFlipped ? card.back : card.front} size={14} />
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors px-2"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-red-500 hover:text-red-400 transition-colors px-2"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
