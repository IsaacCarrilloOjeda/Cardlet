'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'
export type AccentKey = 'indigo' | 'purple' | 'blue' | 'emerald' | 'rose' | 'orange' | 'amber' | 'teal'

export const ACCENT_COLORS: Record<AccentKey, { accent: string; hover: string; label: string }> = {
  indigo:  { accent: '#6366f1', hover: '#4f46e5', label: 'Indigo' },
  purple:  { accent: '#a855f7', hover: '#9333ea', label: 'Purple' },
  blue:    { accent: '#3b82f6', hover: '#2563eb', label: 'Blue' },
  emerald: { accent: '#10b981', hover: '#059669', label: 'Green' },
  rose:    { accent: '#f43f5e', hover: '#e11d48', label: 'Rose' },
  orange:  { accent: '#f97316', hover: '#ea580c', label: 'Orange' },
  amber:   { accent: '#f59e0b', hover: '#d97706', label: 'Amber' },
  teal:    { accent: '#14b8a6', hover: '#0d9488', label: 'Teal' },
}

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
  accentKey: AccentKey
  setAccent: (key: AccentKey) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggle: () => {},
  accentKey: 'indigo',
  setAccent: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function applyAccent(key: AccentKey) {
  const c = ACCENT_COLORS[key]
  document.documentElement.style.setProperty('--accent', c.accent)
  document.documentElement.style.setProperty('--accent-hover', c.hover)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [accentKey, setAccentKey] = useState<AccentKey>('indigo')

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null
    const storedAccent = localStorage.getItem('accent') as AccentKey | null
    const t = storedTheme ?? 'dark'
    const a = (storedAccent && ACCENT_COLORS[storedAccent]) ? storedAccent : 'indigo'
    setTheme(t)
    setAccentKey(a)
    document.documentElement.dataset.theme = t
    applyAccent(a)
  }, [])

  function toggle() {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', next)
      document.documentElement.dataset.theme = next
      return next
    })
  }

  function setAccent(key: AccentKey) {
    setAccentKey(key)
    localStorage.setItem('accent', key)
    applyAccent(key)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, accentKey, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}
