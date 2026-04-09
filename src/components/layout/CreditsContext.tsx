'use client'

import { createContext, useContext, useEffect, useState } from 'react'

// Credit costs
export const TUTOR_FULL_COST = 10    // full AI tutor message
export const TUTOR_HALF_COST = 5     // half-performance tutor message
export const WRITTEN_GRADING_COST = 1
export const CARD_GEN_COST = 1       // per card generated
export const DISTRACTOR_COST = 1     // per multiple-choice card (AI distractors)

interface Credits {
  credits: number
  totalCredits: number
}

interface CreditsContextValue extends Credits {
  addCredits: () => void
  consumeCredits: (amount: number) => boolean
}

const BUNDLE = 100
const DEFAULT: Credits = { credits: 100, totalCredits: 100 }

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
    } catch {}
  }, [])

  function save(next: Credits) {
    setCredits(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  function addCredits() {
    save({
      credits: credits.credits + BUNDLE,
      totalCredits: credits.totalCredits + BUNDLE,
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
