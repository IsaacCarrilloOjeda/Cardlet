'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { SpeakButton } from './SpeakButton'

interface Props {
  front: string
  back: string
  isFlipped: boolean
  onFlip: () => void
  onExplain?: () => void
  isExplaining?: boolean
  explanation?: string | null
}

function ExplainButton({ onClick, isLoading }: { onClick: (e: React.MouseEvent) => void; isLoading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="flex items-center gap-1 rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-2 py-1 text-[11px] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors disabled:opacity-50"
      title="Explain this card (2 credits)"
    >
      {isLoading ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )}
      {isLoading ? 'Explaining...' : 'Explain'}
    </button>
  )
}

export function CardFlip({ front, back, isFlipped, onFlip, onExplain, isExplaining, explanation }: Props) {
  function handleExplainClick(e: React.MouseEvent) {
    e.stopPropagation()
    onExplain?.()
  }

  return (
    <div className="flex flex-col gap-3">
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
            {onExplain && (
              <div className="absolute bottom-3 left-3">
                <ExplainButton onClick={handleExplainClick} isLoading={isExplaining} />
              </div>
            )}
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
            {onExplain && (
              <div className="absolute bottom-3 left-3">
                <ExplainButton onClick={handleExplainClick} isLoading={isExplaining} />
              </div>
            )}
            <p className="text-lg md:text-2xl leading-relaxed">{back}</p>
          </div>
        </motion.div>
      </div>

      {/* Explanation panel */}
      <AnimatePresence>
        {explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-3">
              <div className="flex items-start gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p className="text-sm leading-relaxed">{explanation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
