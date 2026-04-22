'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LANGUAGES } from './lessonData'
import type { LangProgress } from './LanguagePage'
import {
  getStreak, getDailyXp, getDailyGoal, getMistakes,
  hasPassedCheckpoint, subscribeLangStorage,
} from './storage'

interface Props { progress: Record<string, LangProgress> }

interface LangRow {
  langId: string
  name: string
  color: string
  nativeName: string
  xp: number
  lessons: number
  totalLessons: number
  unitsPassed: number
  totalUnits: number
  mistakes: number
}

function computeRows(progress: Record<string, LangProgress>): LangRow[] {
  return LANGUAGES
    .filter((l) => l.available)
    .map((l) => {
      const p = progress[l.id]
      const totalLessons = l.units.reduce((n, u) => n + u.lessons.length, 0)
      const unitsPassed = l.units.filter((u) => hasPassedCheckpoint(u.id)).length
      return {
        langId: l.id,
        name: l.name,
        nativeName: l.nativeName,
        color: l.color,
        xp: p?.xp ?? 0,
        lessons: p?.completedLessons.length ?? 0,
        totalLessons,
        unitsPassed,
        totalUnits: l.units.length,
        mistakes: getMistakes(l.id).length,
      }
    })
    .filter((r) => r.xp > 0 || r.lessons > 0 || r.mistakes > 0)
    .sort((a, b) => b.xp - a.xp)
}

export function LanguageStatsPanel({ progress }: Props) {
  const [streak, setStreak] = useState<{ count: number; active: boolean }>({ count: 0, active: false })
  const [dailyXp, setDailyXp] = useState(0)
  const [dailyGoal, setDailyGoal] = useState(20)
  const [rows, setRows] = useState<LangRow[]>([])

  useEffect(() => {
    const refresh = () => {
      setStreak(getStreak())
      setDailyXp(getDailyXp())
      setDailyGoal(getDailyGoal())
      setRows(computeRows(progress))
    }
    refresh()
    return subscribeLangStorage(refresh)
  }, [progress])

  if (rows.length === 0) return null

  const totalXp = rows.reduce((s, r) => s + r.xp, 0)
  const totalLessons = rows.reduce((s, r) => s + r.lessons, 0)
  const totalMistakes = rows.reduce((s, r) => s + r.mistakes, 0)
  const goalPct = Math.min(100, Math.round((dailyXp / Math.max(1, dailyGoal)) * 100))

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--muted)]">
          Your Progress
        </h2>
        <Link
          href="/leaderboard/languages"
          className="text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Leaderboard →
        </Link>
      </div>

      {/* Top-line stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Streak" value={`${streak.count}d`} accent={streak.active} />
        <StatCard label="Total XP" value={totalXp.toLocaleString()} />
        <StatCard label="Lessons" value={String(totalLessons)} />
        <StatCard label="Weak Words" value={String(totalMistakes)} muted />
      </div>

      {/* Daily goal bar */}
      <div
        className="rounded-2xl p-4 mb-5"
        style={{ background: 'var(--surface)', border: '2px solid var(--card-border)' }}
      >
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span className="text-[var(--muted)] uppercase tracking-wider">Today</span>
          <span style={{ color: 'var(--accent)' }}>
            {dailyXp} / {dailyGoal} XP
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${goalPct}%`, background: 'var(--accent)' }}
          />
        </div>
      </div>

      {/* Per-language rows */}
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => {
          const progressPct = r.totalLessons === 0 ? 0 : Math.round((r.lessons / r.totalLessons) * 100)
          return (
            <div
              key={r.langId}
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface)', border: '2px solid var(--card-border)' }}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black"
                    style={{ background: `${r.color}20`, color: r.color, border: `2px solid ${r.color}40` }}
                  >
                    {r.langId.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-[var(--foreground)] truncate">{r.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {r.lessons} / {r.totalLessons} lessons · {r.unitsPassed} / {r.totalUnits} units passed
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-black" style={{ color: 'var(--accent)' }}>
                    {r.xp.toLocaleString()} XP
                  </p>
                  {r.mistakes > 0 && (
                    <p className="text-[11px] font-bold text-[var(--muted)]">{r.mistakes} weak words</p>
                  )}
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                <div className="h-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, background: r.color }} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function StatCard({
  label, value, accent, muted,
}: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return (
    <div
      className="rounded-2xl p-4 text-center"
      style={{
        background: accent ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--surface)',
        border: `2px solid ${accent ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'var(--card-border)'}`,
      }}
    >
      <p
        className="text-2xl font-black"
        style={{ color: accent ? 'var(--accent)' : muted ? 'var(--muted)' : 'var(--foreground)' }}
      >
        {value}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mt-1">{label}</p>
    </div>
  )
}
