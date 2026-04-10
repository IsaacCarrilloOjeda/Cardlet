'use client'

import { useState, useRef, useEffect } from 'react'

const COMMON_SUBJECTS = [
  'Math', 'Algebra', 'Geometry', 'Calculus', 'Statistics',
  'Biology', 'Chemistry', 'Physics', 'Science', 'Earth Science',
  'History', 'US History', 'World History', 'Geography', 'Political Science', 'Economics',
  'English', 'Literature', 'Writing', 'Grammar',
  'Spanish', 'French', 'Latin', 'Language',
  'Computer Science', 'Programming',
  'Art', 'Music', 'Psychology', 'Philosophy', 'Sociology',
]

interface Props {
  name: string
  defaultValue?: string
  suggestions?: string[]
  placeholder?: string
}

export function SubjectInput({ name, defaultValue = '', suggestions = [], placeholder }: Props) {
  const [value, setValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Merge user suggestions with common subjects, deduplicate case-insensitively
  const allSuggestions = Array.from(
    new Map([...suggestions, ...COMMON_SUBJECTS].map((s) => [s.toLowerCase(), s])).values()
  )

  const filtered = value.trim()
    ? allSuggestions
        .filter((s) => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase())
        .slice(0, 3)
    : []

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const showDropdown = open && (filtered.length > 0 || value.trim().length > 0)

  return (
    <div ref={wrapperRef} className="relative">
      <input
        name={name}
        value={value}
        onChange={(e) => { setValue(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? 'e.g. Biology, History, Math'}
        className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
        autoComplete="off"
      />
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-lg overflow-hidden">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setValue(s); setOpen(false) }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
            >
              {s}
            </button>
          ))}
          {value.trim() && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setOpen(false) }}
              className="w-full px-3 py-2 text-sm text-left text-[var(--muted)] hover:bg-[var(--accent)]/10 transition-colors border-t border-[var(--card-border)]"
            >
              Use &ldquo;{value}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
