'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DAILY_GOAL_OPTIONS, getDailyGoal, getDailyXp, getStreak, setDailyGoal,
  subscribeLangStorage,
} from './storage'

function FlameIcon({ active, size = 16 }: { active: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={active ? 'var(--accent)' : 'none'}
      stroke={active ? 'var(--accent)' : 'var(--muted)'}
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
    </svg>
  )
}

export function StreakGoalBar() {
  const [xp, setXp] = useState(0)
  const [goal, setGoalState] = useState(20)
  const [streak, setStreak] = useState<{ count: number; active: boolean }>({ count: 0, active: false })
  const [openPicker, setOpenPicker] = useState(false)
  const [celebrated, setCelebrated] = useState(false)

  useEffect(() => {
    const refresh = () => {
      setXp(getDailyXp())
      setGoalState(getDailyGoal())
      setStreak(getStreak())
    }
    refresh()
    return subscribeLangStorage(refresh)
  }, [])

  const pct = goal > 0 ? Math.min(100, (xp / goal) * 100) : 0
  const hitGoal = xp >= goal && goal > 0

  useEffect(() => {
    if (hitGoal && !celebrated) {
      setCelebrated(true)
      const t = setTimeout(() => setCelebrated(false), 1600)
      return () => clearTimeout(t)
    }
  }, [hitGoal, celebrated])

  return (
    <div className="w-full flex items-center gap-3 px-4 py-2.5 border-b"
      style={{ background: 'var(--background)', borderColor: 'var(--card-border)' }}>
      {/* Streak */}
      <button
        onClick={() => setOpenPicker((v) => !v)}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 hover:bg-[var(--surface)] transition-colors"
        title="Daily streak"
      >
        <FlameIcon active={streak.active} />
        <span className="text-sm font-black tabular-nums"
          style={{ color: streak.active ? 'var(--accent)' : 'var(--muted)' }}>
          {streak.count}
        </span>
      </button>

      {/* Daily goal bar */}
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 relative h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--card-border)' }}>
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: 'var(--accent)' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
          <AnimatePresence>
            {celebrated && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-full"
                style={{ background: 'var(--accent)', boxShadow: '0 0 16px var(--accent)' }}
              />
            )}
          </AnimatePresence>
        </div>
        <span className="text-xs font-bold tabular-nums text-[var(--muted)] whitespace-nowrap">
          <span style={{ color: hitGoal ? 'var(--accent)' : 'var(--foreground)' }}>{xp}</span>
          <span className="opacity-60"> / {goal} XP</span>
        </span>
      </div>

      {/* Goal picker */}
      <div className="relative">
        <button
          onClick={() => setOpenPicker((v) => !v)}
          className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors px-2 py-1 rounded-full"
          title="Change daily goal"
        >
          Goal
        </button>
        <AnimatePresence>
          {openPicker && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute right-0 top-full mt-2 rounded-xl border shadow-lg p-2 z-20 min-w-[8rem]"
              style={{ background: 'var(--surface)', borderColor: 'var(--card-border)' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] px-2 pb-1">Daily goal</p>
              {DAILY_GOAL_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => { setDailyGoal(n); setOpenPicker(false) }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                  style={{
                    background: n === goal ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'transparent',
                    color: n === goal ? 'var(--accent)' : 'var(--foreground)',
                  }}
                >
                  {n} XP/day
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
