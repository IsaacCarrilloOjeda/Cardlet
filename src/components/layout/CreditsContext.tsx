'use client'

import { createContext, useContext, useEffect, useState } from 'react'

// Credit costs
export const TUTOR_FULL_COST = 10        // full AI tutor message
export const TUTOR_HALF_COST = 5         // half-performance tutor message
export const WRITTEN_GRADING_COST = 1
export const CARD_GEN_COST = 1           // per card generated
export const DISTRACTOR_COST = 1         // per multiple-choice card (AI distractors)
export const IMAGE_OCR_COST = 3          // photo → text transcription
export const HINT_COST = 2               // single smart hint in study session
export const PRACTICE_EXAM_COST = 5      // generate full practice exam
export const POST_QUIZ_REVIEW_COST = 3   // AI explanation of wrong answers
export const CARD_IMPROVE_COST = 1       // rewrite a single card
export const CARD_IMAGE_COST = 4         // generate image for a card
export const ELI_EXPLAIN_COST = 2        // ELI5/15/25 explanation
export const AUTO_TAG_COST = 2           // bulk auto-tag sets
export const AUTO_SPLIT_COST = 1         // bulk paste auto-splitter
export const EQUATION_SOLVE_COST = 3     // step-by-step equation solver

interface Credits {
  credits: number
  totalCredits: number
}

interface CreditsContextValue extends Credits {
  addCredits: (amount?: number) => void
  consumeCredits: (amount: number) => boolean
}

const BUNDLE = 100
const DEFAULT: Credits = { credits: 500, totalCredits: 500 } // Changed from 100 to 500

const RESET_KEY = 'ss_credits_reset'

const CreditsContext = createContext<CreditsContextValue>({
  ...DEFAULT,
  addCredits: () => {},
  consumeCredits: () => true,
})

export function useCredits() {
  return useContext(CreditsContext)
}

const STORAGE_KEY = 'ss_credits_v2'

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState<Credits>(DEFAULT)

  useEffect(() => {
    try {
      // One-time migration from old key(s) — only runs if ss_credits_v2 is absent
      if (!localStorage.getItem(STORAGE_KEY)) {
        for (const oldKey of ['ss_credits_v1', 'ss_credits']) {
          const raw = localStorage.getItem(oldKey)
          if (raw) {
            try {
              const parsed = JSON.parse(raw)
              if (typeof parsed.credits === 'number' && typeof parsed.totalCredits === 'number') {
                localStorage.setItem(STORAGE_KEY, raw)
              }
            } catch {}
            localStorage.removeItem(oldKey)
            break
          }
        }
      }
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setCredits(JSON.parse(stored))

      // Monthly reset: users get 500 credits on the 1st of each month
      const now = new Date()
      const resetRaw = localStorage.getItem(RESET_KEY)
      const lastReset = resetRaw ? JSON.parse(resetRaw) : null
      const isNewMonth =
        !lastReset ||
        lastReset.year < now.getFullYear() ||
        (lastReset.year === now.getFullYear() && lastReset.month < now.getMonth())
      if (isNewMonth) {
        const fresh: Credits = { credits: 500, totalCredits: 500 } // Changed from 100 to 500
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
        localStorage.setItem(RESET_KEY, JSON.stringify({ month: now.getMonth(), year: now.getFullYear() }))
        setCredits(fresh)
      }
    } catch {}
  }, [])

  function save(next: Credits) {
    setCredits(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  function addCredits(amount: number = BUNDLE) {
    // This function is kept for compatibility but will be effectively disabled
    // in the credits purchase page
    save({
      credits: credits.credits + amount,
      totalCredits: credits.totalCredits + amount,
    })
  }

  function consumeCredits(amount: number): boolean {
    if (credits.credits < amount) return false
    save({ ...credits, credits: credits.credits - amount })
    return true
  }

  return (
    <CreditsContext.Provider value={{ ...credits, addCredits, consumeCredits }}>
      {children}
    </CreditsContext.Provider>
  )
}