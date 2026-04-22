'use client'

import { useEffect, useState } from 'react'
import type { Exercise, Lesson } from './lessonData'
import { getMistakes, type MistakeEntry, subscribeLangStorage } from './storage'

const GENERIC_ENGLISH_DISTRACTORS = [
  'water', 'food', 'house', 'time', 'person', 'book', 'friend', 'day', 'night', 'tree',
  'street', 'car', 'road', 'door', 'window', 'table', 'chair', 'cat', 'dog', 'hand',
  'eye', 'city', 'hello', 'goodbye', 'thank you', 'please', 'yes', 'no', 'big', 'small',
]

/** Shuffle in-place and return the same array. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Build a synthetic review lesson from a user's most-missed words. */
export function buildReviewLesson(langId: string, entries: MistakeEntry[]): Lesson | null {
  if (entries.length === 0) return null
  const top = entries.slice(0, 10)
  const allEnglish = top.map((e) => e.english)

  const exercises: Exercise[] = top.map((entry) => {
    const pool = [
      ...allEnglish.filter((w) => w && w !== entry.english),
      ...GENERIC_ENGLISH_DISTRACTORS.filter((w) => w !== entry.english),
    ]
    const seen = new Set<string>([entry.english.toLowerCase()])
    const distractors: string[] = []
    for (const cand of shuffle([...pool])) {
      const key = cand.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      distractors.push(cand)
      if (distractors.length >= 3) break
    }
    const options = shuffle([entry.english, ...distractors])
    const correctIndex = options.indexOf(entry.english)
    return {
      type: 'multipleChoice',
      question: `What does "${entry.target}" mean?`,
      options,
      correctIndex,
    }
  })

  return {
    id: `review-${langId}-${Date.now()}`,
    title: 'Review weak words',
    icon: 'conversation',
    xpReward: Math.min(20, 5 + top.length * 2),
    exercises,
  }
}

interface Props {
  langId: string
  onStart: (lesson: Lesson) => void
}

export function ReviewWeakWords({ langId, onStart }: Props) {
  const [entries, setEntries] = useState<MistakeEntry[]>([])

  useEffect(() => {
    const refresh = () => setEntries(getMistakes(langId))
    refresh()
    return subscribeLangStorage(refresh)
  }, [langId])

  if (entries.length === 0) return null

  const count = Math.min(entries.length, 10)

  return (
    <button
      onClick={() => {
        const lesson = buildReviewLesson(langId, entries)
        if (lesson) onStart(lesson)
      }}
      className="w-full group flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all focus:outline-none"
      style={{
        background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
        border: '2px solid color-mix(in srgb, var(--accent) 35%, transparent)',
      }}
    >
      <div
        className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--accent)', color: 'white' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <polyline points="3 3 3 8 8 8" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
          Spaced repetition
        </p>
        <p className="font-black text-[var(--foreground)] truncate">
          Review weak words ({count})
        </p>
      </div>
      <svg
        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)"
        strokeWidth={3} strokeLinecap="round"
        className="shrink-0 transition-transform group-hover:translate-x-0.5"
      >
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </button>
  )
}
