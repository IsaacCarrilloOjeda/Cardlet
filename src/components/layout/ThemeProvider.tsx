'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'
export type AccentKey = 'cardlet' | 'indigo' | 'purple' | 'blue' | 'emerald' | 'rose' | 'orange' | 'amber' | 'teal'
export type CtaKey = 'yellow' | 'red' | 'orange' | 'green' | 'blue' | 'pink'

export const ACCENT_COLORS: Record<AccentKey, { accent: string; hover: string; label: string }> = {
  cardlet: { accent: '#4255ff', hover: '#3346e0', label: 'Cardlet' },
  indigo:  { accent: '#6366f1', hover: '#4f46e5', label: 'Indigo' },
  purple:  { accent: '#a855f7', hover: '#9333ea', label: 'Purple' },
  blue:    { accent: '#3b82f6', hover: '#2563eb', label: 'Blue' },
  emerald: { accent: '#10b981', hover: '#059669', label: 'Green' },
  rose:    { accent: '#f43f5e', hover: '#e11d48', label: 'Rose' },
  orange:  { accent: '#f97316', hover: '#ea580c', label: 'Orange' },
  amber:   { accent: '#f59e0b', hover: '#d97706', label: 'Amber' },
  teal:    { accent: '#14b8a6', hover: '#0d9488', label: 'Teal' },
}

export const CTA_COLORS: Record<CtaKey, { cta: string; ctaText: string; label: string }> = {
  yellow: { cta: '#ffcd1f', ctaText: '#1a1a1a', label: 'Yellow' },
  red:    { cta: '#ef4444', ctaText: '#ffffff', label: 'Red' },
  orange: { cta: '#f97316', ctaText: '#ffffff', label: 'Orange' },
  green:  { cta: '#10b981', ctaText: '#ffffff', label: 'Green' },
  blue:   { cta: '#3b82f6', ctaText: '#ffffff', label: 'Blue' },
  pink:   { cta: '#ec4899', ctaText: '#ffffff', label: 'Pink' },
}

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
  accentKey: AccentKey
  setAccent: (key: AccentKey) => void
  ctaKey: CtaKey
  setCta: (key: CtaKey) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggle: () => {},
  accentKey: 'cardlet',
  setAccent: () => {},
  ctaKey: 'yellow',
  setCta: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function applyAccent(key: AccentKey) {
  const c = ACCENT_COLORS[key]
  document.documentElement.style.setProperty('--accent', c.accent)
  document.documentElement.style.setProperty('--accent-hover', c.hover)
}

function applyCta(key: CtaKey) {
  const c = CTA_COLORS[key]
  document.documentElement.style.setProperty('--cta', c.cta)
  document.documentElement.style.setProperty('--cta-text', c.ctaText)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [accentKey, setAccentKey] = useState<AccentKey>('cardlet')
  const [ctaKey, setCtaKey] = useState<CtaKey>('yellow')

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null
    const storedAccent = localStorage.getItem('accent') as AccentKey | null
    const storedCta = localStorage.getItem('cta') as CtaKey | null

    const t = storedTheme ?? 'dark'
    const a = (storedAccent && ACCENT_COLORS[storedAccent]) ? storedAccent : 'cardlet'
    const c = (storedCta && CTA_COLORS[storedCta]) ? storedCta : 'yellow'

    setTheme(t)
    setAccentKey(a)
    setCtaKey(c)
    document.documentElement.dataset.theme = t
    applyAccent(a)
    applyCta(c)
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

  function setCta(key: CtaKey) {
    setCtaKey(key)
    localStorage.setItem('cta', key)
    applyCta(key)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, accentKey, setAccent, ctaKey, setCta }}>
      {children}
    </ThemeContext.Provider>
  )
}
