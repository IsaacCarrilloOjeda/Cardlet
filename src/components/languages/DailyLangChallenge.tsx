'use client'

import { useEffect, useMemo, useState } from 'react'
import { LANGUAGES, type Lesson } from './lessonData'
import { dailySeed, isDailyChallengeDone, subscribeLangStorage } from './storage'

interface DailyPick { lesson: Lesson; langId: string; langName: string; langColor: string }

/** Deterministic daily pick from every available lesson. Same for all clients, all day. */
function pickToday(): DailyPick | null {
  const all: DailyPick[] = LANGUAGES
    .filter((l) => l.available)
    .flatMap((l) => l.units.flatMap((u) => u.lessons.map((lesson) => ({
      lesson, langId: l.id, langName: l.name, langColor: l.color,
    }))))
  if (all.length === 0) return null
  return all[dailySeed(all.length, 'daily-lang-v1')]
}

export function DailyLangChallenge({ onStart }: { onStart: (p: DailyPick) => void }) {
  const pick = useMemo(pickToday, [])
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDone(isDailyChallengeDone())
    return subscribeLangStorage(() => setDone(isDailyChallengeDone()))
  }, [])

  if (!pick) return null

  return (
    <div className="mb-10">
      <h2 className="text-sm font-black uppercase tracking-widest text-[var(--muted)] mb-4">
        Daily Challenge
      </h2>

      <button
        onClick={() => !done && onStart(pick)}
        disabled={done}
        className="w-full group relative overflow-hidden rounded-2xl p-5 text-left transition-all focus:outline-none"
        style={{
          background: done
            ? 'var(--surface)'
            : 'linear-gradient(120deg, color-mix(in srgb, var(--accent) 18%, transparent), color-mix(in srgb, var(--accent) 4%, transparent))',
          border: `2px solid ${done ? 'var(--card-border)' : 'color-mix(in srgb, var(--accent) 45%, transparent)'}`,
          cursor: done ? 'default' : 'pointer',
          opacity: done ? 0.7 : 1,
        }}
      >
        {/* 2× XP ribbon */}
        {!done && (
          <div
            className="absolute top-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="text-[11px] font-black tracking-wider">2× XP</span>
          </div>
        )}

        <div className="flex items-center gap-4">
          {/* Language pill */}
          <div
            className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-lg"
            style={{ background: `${pick.langColor}22`, color: pick.langColor, border: `2px solid ${pick.langColor}40` }}
          >
            {pick.langId.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
              Today&apos;s lesson
            </p>
            <p className="font-black text-lg text-[var(--foreground)] truncate mt-0.5">
              {pick.langName} · {pick.lesson.title}
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              {done
                ? 'Completed — come back tomorrow for a new one.'
                : `Finish today to earn ${pick.lesson.xpReward * 2} XP.`}
            </p>
          </div>

          {!done && (
            <div
              className="shrink-0 hidden sm:flex items-center justify-center w-11 h-11 rounded-full transition-transform group-hover:translate-x-0.5"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </div>
          )}
          {done && (
            <div
              className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full"
              style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)', color: 'var(--accent)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
        </div>
      </button>
    </div>
  )
}

export type { DailyPick }
