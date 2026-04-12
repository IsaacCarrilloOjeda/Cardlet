'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  open: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { keys: ['Space'], desc: 'Flip card' },
  { keys: ['1'], desc: 'Again (card failed)' },
  { keys: ['2'], desc: 'Hard' },
  { keys: ['3'], desc: 'Good' },
  { keys: ['4'], desc: 'Easy' },
  { keys: ['5'], desc: 'Perfect' },
  { keys: ['S'], desc: 'Skip card' },
  { keys: ['?'], desc: 'Show / hide shortcuts' },
]

function Key({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center justify-center rounded-md border border-[var(--card-border)] bg-[var(--surface-raised)] px-2 py-0.5 text-[11px] font-mono font-semibold text-[var(--foreground)] min-w-[28px]">
      {label}
    </span>
  )
}

export function ShortcutsModal({ open, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-sm mx-4 rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--card-border)]">
                <div>
                  <p className="font-bold text-base">Keyboard Shortcuts</p>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5">Study session controls</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                  aria-label="Close"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <ul className="divide-y divide-[var(--card-border)]">
                {SHORTCUTS.map(({ keys, desc }) => (
                  <li key={keys.join('+')} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-[var(--foreground)]">{desc}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((k) => <Key key={k} label={k} />)}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="px-5 py-3 border-t border-[var(--card-border)]">
                <p className="text-[11px] text-[var(--muted)] text-center">Confidence keys (1–5) only work after flipping</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
