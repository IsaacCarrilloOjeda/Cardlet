'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { deleteCardAction, updateCardImproveAction, setCardImageAction } from '@/lib/actions'
import { CardForm } from './CardForm'
import { SpeakButton } from '@/components/study/SpeakButton'
import { useCredits, CARD_IMPROVE_COST, CARD_IMAGE_COST, ELI_EXPLAIN_COST } from '@/components/layout/CreditsContext'
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
  const [busy, setBusy] = useState<string | null>(null)
  const [eli, setEli] = useState<string | null>(null)
  const [eliLevel, setEliLevel] = useState<5 | 15 | 25>(15)
  const { consumeCredits } = useCredits()
  const diff = DIFFICULTY_LABELS[card.difficulty] ?? DIFFICULTY_LABELS[3]

  async function handleImprove() {
    if (!consumeCredits(CARD_IMPROVE_COST)) return
    setBusy('improve')
    try {
      const res = await fetch('/api/ai/improve-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ front: card.front, back: card.back }),
      })
      const data = await res.json()
      if (res.ok && data.front && data.back) {
        if (confirm(`Replace with:\n\nFront: ${data.front}\nBack: ${data.back}`)) {
          await updateCardImproveAction(card.id, setId, data.front, data.back)
          router.refresh()
        }
      }
    } finally {
      setBusy(null)
    }
  }

  async function handleImage() {
    if (!consumeCredits(CARD_IMAGE_COST)) return
    setBusy('image')
    try {
      const res = await fetch('/api/ai/card-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ front: card.front, back: card.back }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        await setCardImageAction(card.id, setId, data.url)
        router.refresh()
      }
    } finally {
      setBusy(null)
    }
  }

  async function handleEli() {
    if (!consumeCredits(ELI_EXPLAIN_COST)) return
    setBusy('eli')
    try {
      const res = await fetch('/api/ai/eli-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ front: card.front, back: card.back, level: eliLevel }),
      })
      const data = await res.json()
      if (res.ok && data.explanation) setEli(data.explanation)
    } finally {
      setBusy(null)
    }
  }

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

      {/* ELI explanation drop-down */}
      {eli && (
        <div className="border-t border-[var(--card-border)] px-3 py-2 text-xs text-[var(--foreground)]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase font-bold text-[var(--accent)]">ELI{eliLevel}</span>
            <button onClick={() => setEli(null)} className="text-[var(--muted)] text-[10px]">Hide</button>
          </div>
          {eli}
        </div>
      )}

      {/* Card image (if set) */}
      {card.image_url && (
        <div className="border-t border-[var(--card-border)] px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.image_url} alt="Card visual" className="max-h-32 rounded-md mx-auto" />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-end items-center gap-1 border-t border-[var(--card-border)] px-2 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <SpeakButton text={isFlipped ? card.back : card.front} size={14} />
        <select
          value={eliLevel}
          onChange={(e) => setEliLevel(Number(e.target.value) as 5 | 15 | 25)}
          className="text-[10px] rounded bg-[var(--background)] border border-[var(--card-border)] px-1 py-0.5"
          title="Explanation reading level"
        >
          <option value={5}>ELI5</option>
          <option value={15}>ELI15</option>
          <option value={25}>ELI25</option>
        </select>
        <button
          onClick={handleEli}
          disabled={busy !== null}
          className="text-xs text-[var(--accent)] hover:opacity-80 transition-colors px-2 disabled:opacity-40"
          title={`AI explanation (${ELI_EXPLAIN_COST} credits)`}
        >
          💡
        </button>
        <button
          onClick={handleImprove}
          disabled={busy !== null}
          className="text-xs text-[var(--accent)] hover:opacity-80 transition-colors px-2 disabled:opacity-40"
          title={`Improve (${CARD_IMPROVE_COST} credit)`}
        >
          ✨
        </button>
        <button
          onClick={handleImage}
          disabled={busy !== null}
          className="text-xs text-[var(--accent)] hover:opacity-80 transition-colors px-2 disabled:opacity-40"
          title={`Generate image (${CARD_IMAGE_COST} credits)`}
        >
          🖼
        </button>
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
