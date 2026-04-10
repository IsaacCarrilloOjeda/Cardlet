'use client'

import { motion } from 'framer-motion'
import { SpeakButton } from './SpeakButton'

interface Props {
  front: string
  back: string
  isFlipped: boolean
  onFlip: () => void
}

export function CardFlip({ front, back, isFlipped, onFlip }: Props) {
  return (
    <div
      onClick={onFlip}
      className="cursor-pointer select-none"
      style={{ perspective: 1000 }}
    >
      <motion.div
        animate={{ rotateX: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 250, damping: 30 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative h-64 md:h-80"
      >
        {/* Front */}
        <div
          style={{ backfaceVisibility: 'hidden' }}
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center shadow-lg"
        >
          <div className="absolute top-3 right-3">
            <SpeakButton text={front} />
          </div>
          <p className="text-lg md:text-2xl font-semibold leading-relaxed">{front}</p>
          <p className="mt-4 text-xs text-[var(--muted)]">Click or press Space to flip</p>
        </div>

        {/* Back */}
        <div
          style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-8 text-center shadow-lg"
        >
          <div className="absolute top-3 right-3">
            <SpeakButton text={back} />
          </div>
          <p className="text-lg md:text-2xl leading-relaxed">{back}</p>
        </div>
      </motion.div>
    </div>
  )
}
