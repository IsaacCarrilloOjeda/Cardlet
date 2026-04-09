'use client'

import { useState } from 'react'
import { CardPreview } from './CardPreview'
import { CardForm } from './CardForm'
import type { Card } from '@/types'

interface Props {
  cards: Card[]
  setId: string
}

export function CardList({ cards, setId }: Props) {
  const [showAddForm, setShowAddForm] = useState(cards.length === 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{cards.length} Cards</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-sm hover:border-[var(--accent)] transition-colors"
          >
            <span>+</span> Add Card
          </button>
        )}
      </div>

      {cards.map((card, i) => (
        <CardPreview key={card.id} card={card} setId={setId} index={i} />
      ))}

      {showAddForm ? (
        <CardForm
          setId={setId}
          onDone={() => {}} // revalidatePath handles update
          onCancel={cards.length > 0 ? () => setShowAddForm(false) : undefined}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="rounded-xl border border-dashed border-[var(--card-border)] py-8 text-center text-sm text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          + Add another card
        </button>
      )}
    </div>
  )
}
