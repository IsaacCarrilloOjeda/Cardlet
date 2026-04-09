'use client'

import { useEffect, useState } from 'react'

export interface QuizSettings {
  clickToContinue: boolean
}

const DEFAULT: QuizSettings = { clickToContinue: true }
const KEY = 'quiz_settings'

export function useQuizSettings() {
  const [settings, setSettings] = useState<QuizSettings>(DEFAULT)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored) setSettings({ ...DEFAULT, ...JSON.parse(stored) })
    } catch {
      // ignore
    }
  }, [])

  function update(patch: Partial<QuizSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  return { settings, update }
}
