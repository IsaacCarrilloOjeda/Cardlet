'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LANGUAGES, ACHIEVEMENTS, type LanguageMeta, type Lesson, type Achievement } from './lessonData'
import { LessonModal } from './LessonModal'
import { HeartsBar } from './HeartsBar'
import { StreakGoalBar } from './StreakGoalBar'
import { DailyLangChallenge, type DailyPick } from './DailyLangChallenge'
import { getAudioMode, setAudioMode, subscribeLangStorage, markDailyChallengeDone, hasPassedCheckpoint } from './storage'
import type { Unit } from './lessonData'
import { ReviewWeakWords } from './ReviewWeakWords'
import { bumpLanguageXpAction, migrateLanguageXpAction } from '@/lib/actions'
import { UnitActions } from './UnitActions'
import { LanguageStatsPanel } from './LanguageStatsPanel'

const LANG_MIGRATED_KEY = 'cardlet-lang-migrated-v1'

// ─── colours ───────────────────────────────────────────────────────────────────
const G = {
  green: '#58CC02', greenDark: '#46A302',
  yellow: '#FFD900', red: '#FF4B4B', blue: '#1CB0F6',
}

// ─── progress & achievement storage ───────────────────────────────────────────
export interface LangProgress {
  completedLessons: string[]
  xp: number
  streak: number
}

const STORAGE_KEY  = 'cardlet-lang-progress-v1'
const ACTIVE_KEY   = 'cardlet-active-lang'
const ACH_KEY      = 'cardlet-lang-achievements'

function loadProgress(): Record<string, LangProgress> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } catch { return {} }
}

function saveProgress(p: Record<string, LangProgress>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

function loadUnlocked(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(ACH_KEY) ?? '[]') as string[]) } catch { return new Set() }
}

function saveUnlocked(s: Set<string>) {
  localStorage.setItem(ACH_KEY, JSON.stringify(Array.from(s)))
}

function checkAchievements(
  progress: Record<string, LangProgress>,
  perfect: boolean,
  alreadyUnlocked: Set<string>,
): Achievement[] {
  const newlyUnlocked: Achievement[] = []
  const totalXp  = Object.values(progress).reduce((s, p) => s + p.xp, 0)
  const totalLessons = Object.values(progress).reduce((s, p) => s + p.completedLessons.length, 0)
  const langsStudied = Object.keys(progress).filter((k) => (progress[k].completedLessons.length ?? 0) > 0)
  const esSp = progress['es']?.completedLessons ?? []
  const frSp = progress['fr']?.completedLessons ?? []
  const deSp = progress['de']?.completedLessons ?? []

  const rules: Record<string, boolean> = {
    first_lesson:  totalLessons >= 1,
    flawless:      perfect,
    xp_50:         totalXp >= 50,
    xp_100:        totalXp >= 100,
    lessons_5:     totalLessons >= 5,
    polyglot:      langsStudied.length >= 2,
    spanish_u1:    ['es-greetings','es-numbers','es-colors'].every((id) => esSp.includes(id)),
    french_u1:     ['fr-greetings','fr-numbers','fr-colors'].every((id) => frSp.includes(id)),
    german_u1:     ['de-greetings','de-numbers','de-colors'].every((id) => deSp.includes(id)),
  }

  for (const ach of ACHIEVEMENTS) {
    if (!alreadyUnlocked.has(ach.id) && rules[ach.id]) {
      newlyUnlocked.push(ach)
      alreadyUnlocked.add(ach.id)
    }
  }
  return newlyUnlocked
}

// ─── rat mascot ────────────────────────────────────────────────────────────────
function RatMascot({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Tail */}
      <path d="M44 52 Q56 54 58 42 Q60 30 50 26" stroke="#888" strokeWidth="3" strokeLinecap="round" fill="none"/>
      {/* Body */}
      <ellipse cx="30" cy="46" rx="18" ry="13" fill="#909090"/>
      {/* Belly */}
      <ellipse cx="30" cy="48" rx="10" ry="8" fill="#c8c8c8"/>
      {/* Rear leg */}
      <ellipse cx="42" cy="57" rx="6" ry="3" fill="#909090"/>
      {/* Left ear outer */}
      <circle cx="16" cy="23" r="9" fill="#909090"/>
      <circle cx="16" cy="23" r="5.5" fill="#ffb0b0"/>
      {/* Right ear outer */}
      <circle cx="33" cy="21" r="9" fill="#909090"/>
      <circle cx="33" cy="21" r="5.5" fill="#ffb0b0"/>
      {/* Head */}
      <ellipse cx="24" cy="32" rx="15" ry="12" fill="#909090"/>
      {/* Snout */}
      <ellipse cx="17" cy="37" rx="7" ry="4.5" fill="#aaaaaa"/>
      {/* Nose */}
      <ellipse cx="12" cy="37" rx="2.8" ry="2" fill="#ff8888"/>
      {/* Eyes */}
      <circle cx="22" cy="29" r="3.2" fill="#1a1a1a"/>
      <circle cx="23.2" cy="28" r="1.1" fill="white"/>
      {/* Whiskers left */}
      <line x1="12" y1="35.5" x2="1"  y2="32.5" stroke="#aaa" strokeWidth="1"/>
      <line x1="12" y1="37"   x2="1"  y2="37"   stroke="#aaa" strokeWidth="1"/>
      <line x1="12" y1="38.5" x2="1"  y2="41.5" stroke="#aaa" strokeWidth="1"/>
      {/* Whiskers right */}
      <line x1="12" y1="35.5" x2="22" y2="32.5" stroke="#aaa" strokeWidth="1"/>
      <line x1="12" y1="37"   x2="22" y2="37"   stroke="#aaa" strokeWidth="1"/>
      <line x1="12" y1="38.5" x2="22" y2="41.5" stroke="#aaa" strokeWidth="1"/>
      {/* Front paws */}
      <ellipse cx="15" cy="52" rx="5" ry="3" fill="#aaaaaa"/>
      <ellipse cx="33" cy="54" rx="5" ry="3" fill="#aaaaaa"/>
    </svg>
  )
}

// ─── icons ─────────────────────────────────────────────────────────────────────
function LessonIcon({ type, size = 26 }: { type: string; size?: number }) {
  const s = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
  switch (type) {
    case 'greeting': return <svg {...s}><path d="M7 11.5V14.5M7 11.5C7 9.567 8.567 8 10.5 8C12.433 8 14 9.567 14 11.5V14M7 11.5C7 9.567 5.433 8 3.5 8M14 11.5V8.5M14 11.5C14 9.567 15.567 8 17.5 8M20 5H4C2.895 5 2 5.895 2 7V17C2 18.105 2.895 19 4 19H20C21.105 19 22 18.105 22 17V7C22 5.895 21.105 5 20 5Z" /></svg>
    case 'numbers':  return <svg {...s}><path d="M4 9H8M4 15H9M14 9H18M14 15H20M4 6V9M18 9V6M9 15V18M14 18V15" /><rect x="10" y="11" width="4" height="2" rx="1" /></svg>
    case 'colors':   return <svg {...s}><circle cx="12" cy="12" r="9" /><path d="M12 3C12 3 7 7 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 12 3 12 3Z" fill="currentColor" opacity={0.3} /></svg>
    case 'family':   return <svg {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    case 'food':     return <svg {...s}><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>
    case 'restaurant': return <svg {...s}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>
    case 'conversation': return <svg {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
    default: return <svg {...s}><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 3" /></svg>
  }
}

function LockIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

// ─── language card ─────────────────────────────────────────────────────────────
function LanguageCard({ language, progress, onSelect }: {
  language: LanguageMeta; progress?: LangProgress; onSelect: () => void
}) {
  const xp = progress?.xp ?? 0
  const lessons = progress?.completedLessons.length ?? 0

  return (
    <motion.button
      whileHover={language.available ? { y: -3, scale: 1.01 } : {}}
      whileTap={language.available ? { scale: 0.98 } : {}}
      onClick={language.available ? onSelect : undefined}
      className="relative rounded-2xl overflow-hidden text-left focus:outline-none"
      style={{
        background: 'var(--surface)', border: '2px solid var(--card-border)',
        cursor: language.available ? 'pointer' : 'default', opacity: language.available ? 1 : 0.7,
      }}
    >
      <div className="h-20 flex items-center justify-center" style={{ background: `${language.color}22` }}>
        <span className="text-3xl font-black tracking-tight" style={{ color: language.color }}>
          {language.nativeName}
        </span>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-[var(--foreground)] text-base">{language.name}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">{language.description}</p>
          </div>
          {!language.available && <span className="shrink-0 mt-0.5 text-[var(--muted)]"><LockIcon size={16} /></span>}
        </div>
        {language.available ? (
          <div className="mt-3 flex items-center justify-end">
            {lessons > 0 ? (
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{xp} XP</span>
              </div>
            ) : (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: `${language.color}20`, color: language.color }}>Start</span>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs font-bold text-[var(--muted)]">Coming Soon</p>
        )}
      </div>
    </motion.button>
  )
}

// ─── lesson node ───────────────────────────────────────────────────────────────
type NodeState = 'completed' | 'active' | 'locked'

function LessonNode({ lesson, nodeState, unitColor, unitDarkColor, onPress }: {
  lesson: Lesson; nodeState: NodeState
  unitColor: string; unitDarkColor: string; onPress: () => void
}) {
  const isLocked    = nodeState === 'locked'
  const isComplete  = nodeState === 'completed'
  const isActive    = nodeState === 'active'
  const bg   = isComplete ? 'var(--accent)'       : isLocked ? '#E5E5E5' : unitColor
  const dark = isComplete ? 'var(--accent-hover)' : isLocked ? '#AFAFAF' : unitDarkColor
  const iconColor = isLocked ? '#AFAFAF' : 'white'

  return (
    <div className="flex flex-col items-center gap-2">
      {isActive && (
        <div className="relative flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl px-3 py-1 text-xs font-black text-white"
            style={{ background: unitColor }}>
            START
          </motion.div>
        </div>
      )}
      <motion.button
        whileTap={!isLocked ? { scale: 0.92, y: 4 } : {}}
        onClick={!isLocked ? onPress : undefined}
        onKeyDown={(e) => { if (!isLocked && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPress() } }}
        tabIndex={isLocked ? -1 : 0}
        className="relative flex items-center justify-center rounded-full transition-all focus:outline-none focus-visible:ring-2"
        style={{
          width: 72, height: 72, background: bg,
          boxShadow: isLocked ? 'none' : `0 6px 0 ${dark}`,
          cursor: isLocked ? 'not-allowed' : 'pointer',
        }}
        animate={isActive ? {
          boxShadow: [`0 6px 0 ${dark}`, `0 6px 18px ${unitColor}80`, `0 6px 0 ${dark}`],
        } : {}}
        transition={isActive ? { duration: 2, repeat: Infinity } : {}}>
        <span style={{ color: iconColor }}>
          {isComplete ? (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
          ) : isLocked ? <LockIcon size={26} /> : <LessonIcon type={lesson.icon} size={30} />}
        </span>
      </motion.button>
      <span className="text-xs font-bold text-center max-w-[80px] leading-tight"
        style={{ color: isLocked ? 'var(--muted)' : 'var(--foreground)' }}>
        {lesson.title}
      </span>
    </div>
  )
}

// snake offsets
const SNAKE = [0, 60, 96, 60, 0, -60, -96, -60]

// ─── checkpoint node ───────────────────────────────────────────────────────────
function CheckpointTrophyIcon({ size = 30, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M17 3H7L5 7c0 3.87 3.13 7 7 7s7-3.13 7-7l-2-4z" />
      <path d="M5 7H3M19 7h2" />
    </svg>
  )
}

function CheckpointNode({ unit, state, onPress }: {
  unit: Unit; state: NodeState; onPress: () => void
}) {
  const isLocked   = state === 'locked'
  const isComplete = state === 'completed'
  const isActive   = state === 'active'
  const bg   = isComplete ? 'var(--accent)' : isLocked ? '#E5E5E5' : unit.color
  const dark = isComplete ? 'var(--accent-hover)' : isLocked ? '#AFAFAF' : unit.darkColor
  return (
    <div className="flex flex-col items-center gap-2">
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl px-3 py-1 text-xs font-black text-white"
          style={{ background: unit.color }}>
          CHECKPOINT
        </motion.div>
      )}
      <motion.button
        whileTap={!isLocked ? { scale: 0.94, y: 3 } : {}}
        onClick={!isLocked ? onPress : undefined}
        onKeyDown={(e) => { if (!isLocked && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPress() } }}
        tabIndex={isLocked ? -1 : 0}
        className="relative flex items-center justify-center rounded-2xl transition-all focus:outline-none focus-visible:ring-2"
        style={{
          width: 96, height: 72, background: bg,
          boxShadow: isLocked ? 'none' : `0 6px 0 ${dark}`,
          cursor: isLocked ? 'not-allowed' : 'pointer',
        }}
        animate={isActive ? {
          boxShadow: [`0 6px 0 ${dark}`, `0 6px 18px ${unit.color}80`, `0 6px 0 ${dark}`],
        } : {}}
        transition={isActive ? { duration: 2, repeat: Infinity } : {}}>
        {isComplete ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
        ) : isLocked ? <LockIcon size={24} /> : <CheckpointTrophyIcon size={28} />}
      </motion.button>
      <span className="text-xs font-bold text-center max-w-[120px] leading-tight"
        style={{ color: isLocked ? 'var(--muted)' : 'var(--foreground)' }}>
        {isComplete ? `${unit.title} passed` : `${unit.title} test`}
      </span>
    </div>
  )
}

// ─── unit banner ───────────────────────────────────────────────────────────────
function UnitBanner({ title, subtitle, color, xp }: {
  title: string; subtitle: string; color: string; xp: number
}) {
  return (
    <div className="w-full rounded-2xl px-5 py-4 flex items-center justify-between"
      style={{ background: `${color}18`, border: `2px solid ${color}40` }}>
      <div>
        <p className="text-xs font-black uppercase tracking-widest" style={{ color }}>{title}</p>
        <p className="font-bold text-[var(--foreground)] text-base mt-0.5">{subtitle}</p>
      </div>
      {xp > 0 && (
        <div className="flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          <span className="text-sm font-black" style={{ color: 'var(--accent)' }}>{xp} XP</span>
        </div>
      )}
    </div>
  )
}

// ─── headphones (audio mode) ───────────────────────────────────────────────────
function HeadphonesIcon({ active, size = 18 }: { active: boolean; size?: number }) {
  const c = active ? 'var(--accent)' : 'var(--muted)'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z" />
    </svg>
  )
}

// ─── skill tree ────────────────────────────────────────────────────────────────
function SkillTreeView({ language, progress, audioOnly, onToggleAudio, onBack, onLessonStart, onReviewStart, onCheckpointStart }: {
  language: LanguageMeta; progress?: LangProgress
  audioOnly: boolean; onToggleAudio: () => void
  onBack: () => void
  onLessonStart: (lesson: Lesson) => void
  onReviewStart: (lesson: Lesson) => void
  onCheckpointStart: (unit: Unit) => void
}) {
  const completed  = new Set(progress?.completedLessons ?? [])
  const totalXp    = progress?.xp ?? 0
  const allLessons = language.units.flatMap((u) => u.lessons)

  // First undone step (lesson OR checkpoint) across all units. Checkpoints appear at the
  // end of a unit whose lessons are all complete when a next non-locked unit exists.
  let activeStepKey: string | null = null
  for (let i = 0; i < language.units.length && !activeStepKey; i++) {
    const u = language.units[i]
    if (u.locked) continue
    for (const l of u.lessons) {
      if (!completed.has(l.id)) { activeStepKey = `lesson:${l.id}`; break }
    }
    if (activeStepKey) break
    const hasNextUnit = language.units.slice(i + 1).some((n) => !n.locked)
    if (hasNextUnit && !hasPassedCheckpoint(u.id)) activeStepKey = `checkpoint:${u.id}`
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex flex-col"
        style={{ background: 'var(--background)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: 'var(--card-border)' }}>
          <button onClick={onBack}
            className="rounded-full p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-black text-base text-[var(--foreground)] truncate">{language.name}</p>
            <p className="text-xs text-[var(--muted)] truncate">{language.nativeName}</p>
          </div>
          <HeartsBar compact />
          <button onClick={onToggleAudio}
            title={audioOnly ? 'Turn off audio-only mode' : 'Audio-only mode'}
            className="rounded-full p-2 transition-colors"
            style={{
              background: audioOnly ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'transparent',
              border: `2px solid ${audioOnly ? 'var(--accent)' : 'var(--card-border)'}`,
            }}>
            <HeadphonesIcon active={audioOnly} />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            <span className="text-sm font-black" style={{ color: 'var(--accent)' }}>{totalXp}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-sm font-bold text-[var(--muted)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            <span style={{ color: 'var(--accent)' }}>{completed.size}</span>
            <span>/ {allLessons.length}</span>
          </div>
        </div>
        <StreakGoalBar />
      </div>

      {/* Path */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-sm mx-auto flex flex-col gap-10">
          <ReviewWeakWords langId={language.id} onStart={onReviewStart} />
          {language.units.map((unit, ui) => {
            const unitXp = unit.lessons.reduce((acc, l) => acc + (completed.has(l.id) ? l.xpReward : 0), 0)
            const globalOffset = language.units.slice(0, ui).flatMap((u) => u.lessons).length
            const unitComplete = unit.lessons.every((l) => completed.has(l.id))
            const hasNextUnit = language.units.slice(ui + 1).some((n) => !n.locked)
            const checkpointPassed = hasPassedCheckpoint(unit.id)
            const showCheckpoint = !unit.locked && unitComplete && hasNextUnit
            const checkpointKey = `checkpoint:${unit.id}`
            const checkpointState: NodeState = checkpointPassed
              ? 'completed'
              : activeStepKey === checkpointKey ? 'active' : 'locked'
            return (
              <div key={unit.id} className="flex flex-col gap-6">
                <UnitBanner title={unit.title} subtitle={unit.subtitle} color={unit.color} xp={unitXp} />
                {!unit.locked && unitComplete && (
                  <UnitActions langId={language.id} langName={language.name} unit={unit} />
                )}
                {unit.locked ? (
                  <div className="flex flex-col items-center gap-3 py-6 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--card-border)' }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--surface)', border: '2px solid var(--card-border)' }}>
                      <LockIcon size={28} />
                    </div>
                    <p className="text-sm font-bold text-[var(--muted)]">Coming soon</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    {unit.lessons.map((lesson, li) => {
                      const globalIdx = globalOffset + li
                      const isComp   = completed.has(lesson.id)
                      const isActive = activeStepKey === `lesson:${lesson.id}`
                      const state: NodeState = isComp ? 'completed' : isActive ? 'active' : 'locked'
                      const offset = SNAKE[globalIdx % SNAKE.length]
                      return (
                        <div key={lesson.id} className="flex flex-col items-center w-full">
                          {li > 0 && <div className="h-6" />}
                          <div style={{ transform: `translateX(${offset}px)` }}>
                            <LessonNode lesson={lesson} nodeState={state}
                              unitColor={unit.color} unitDarkColor={unit.darkColor}
                              onPress={() => onLessonStart(lesson)} />
                          </div>
                        </div>
                      )
                    })}
                    {showCheckpoint && (
                      <div className="flex flex-col items-center w-full mt-6">
                        <CheckpointNode
                          unit={unit} state={checkpointState}
                          onPress={() => onCheckpointStart(unit)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {activeStepKey === null && allLessons.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 py-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', border: '3px solid var(--accent)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="var(--accent)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              </div>
              <p className="font-black text-lg text-[var(--foreground)] text-center">
                You&apos;ve mastered {language.name}!
              </p>
              <p className="text-[var(--muted)] text-sm text-center">More units coming soon.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── main page ─────────────────────────────────────────────────────────────────
export function LanguagePage() {
  const [selectedLangId, setSelectedLangId] = useState<string | null>(null)
  const [progress, setProgress]             = useState<Record<string, LangProgress>>({})
  const [unlockedAch, setUnlockedAch]       = useState<Set<string>>(new Set())
  const [activeLesson, setActiveLesson]     = useState<{
    lesson: Lesson; langId: string; xpMultiplier?: number;
    isDailyChallenge?: boolean; isReview?: boolean;
    checkpoint?: { unitId: string };
  } | null>(null)
  const [pendingAch, setPendingAch]         = useState<Achievement[]>([])
  const [mounted, setMounted]               = useState(false)
  const [audioOnly, setAudioOnly]           = useState(false)

  useEffect(() => {
    const loaded = loadProgress()
    setProgress(loaded)
    setUnlockedAch(loadUnlocked())
    const saved = localStorage.getItem(ACTIVE_KEY)
    if (saved) setSelectedLangId(saved)
    setAudioOnly(getAudioMode())
    setMounted(true)

    // One-shot migration of offline language XP to the DB. Idempotent on the
    // server (uses GREATEST), so re-running it from another browser is safe.
    if (!localStorage.getItem(LANG_MIGRATED_KEY)) {
      const entries = Object.entries(loaded)
        .map(([langId, p]) => ({ langId, xp: p.xp, lessons: p.completedLessons.length }))
        .filter((e) => e.xp > 0 || e.lessons > 0)
      if (entries.length > 0) {
        migrateLanguageXpAction(entries)
          .then(() => localStorage.setItem(LANG_MIGRATED_KEY, '1'))
          .catch(() => {/* guest or DB down — will retry next mount */})
      } else {
        localStorage.setItem(LANG_MIGRATED_KEY, '1')
      }
    }

    return subscribeLangStorage(() => setAudioOnly(getAudioMode()))
  }, [])

  function toggleAudioOnly() {
    const next = !audioOnly
    setAudioOnly(next)
    setAudioMode(next)
  }

  function handleSelectLanguage(langId: string) {
    setSelectedLangId(langId)
    localStorage.setItem(ACTIVE_KEY, langId)
  }

  function handleLessonComplete(
    langId: string, lessonId: string, xpEarned: number, perfect: boolean,
    opts: { isDailyChallenge?: boolean; isReview?: boolean } = {},
  ) {
    setProgress((prev) => {
      const existing = prev[langId] ?? { completedLessons: [], xp: 0, streak: 0 }
      // Review lessons don't unlock anything; they only grant XP.
      const completedLessons = opts.isReview
        ? existing.completedLessons
        : existing.completedLessons.includes(lessonId)
          ? existing.completedLessons
          : [...existing.completedLessons, lessonId]
      const updated: LangProgress = {
        ...existing,
        completedLessons,
        xp:     existing.xp + xpEarned,
        streak: existing.streak + 1,
      }
      const next = { ...prev, [langId]: updated }
      saveProgress(next)

      // check achievements
      const unlocked = loadUnlocked()
      const newAch = checkAchievements(next, perfect, unlocked)
      if (newAch.length > 0) {
        saveUnlocked(unlocked)
        setUnlockedAch(new Set(unlocked))
        setPendingAch(newAch)
      }
      return next
    })
    if (opts.isDailyChallenge) markDailyChallengeDone()
    // Best-effort DB bump for the language leaderboard. Silent no-op for guests.
    // Review lessons count toward XP but not lesson count (they're replayable).
    bumpLanguageXpAction(langId, xpEarned, opts.isReview ? 0 : 1).catch(() => {})
    setActiveLesson(null)
  }

  function handleStartDaily(pick: DailyPick) {
    const bonusLesson: Lesson = { ...pick.lesson, xpReward: pick.lesson.xpReward * 2 }
    setActiveLesson({ lesson: bonusLesson, langId: pick.langId, xpMultiplier: 2, isDailyChallenge: true })
  }

  function handleStartCheckpoint(langId: string, unit: Unit) {
    // Build a synthetic lesson pooling all exercises from the unit's lessons.
    const pooledExercises = unit.lessons.flatMap((l) => l.exercises)
    const checkpointLesson: Lesson = {
      id: `checkpoint-${unit.id}`,
      title: `${unit.title} Checkpoint`,
      icon: 'conversation',
      xpReward: 30,
      exercises: pooledExercises,
    }
    setActiveLesson({ lesson: checkpointLesson, langId, checkpoint: { unitId: unit.id } })
  }

  const selectedLang = LANGUAGES.find((l) => l.id === selectedLangId)

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: G.green, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {!selectedLang ? (
          <motion.div key="picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }}>
            {/* Hero */}
            <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, transparent) 0%, var(--background) 60%)', borderBottom: '1px solid var(--card-border)' }}>
              <div className="max-w-4xl mx-auto px-6 pt-14 pb-12">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  {/* Rat mascot */}
                  <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center"
                      style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', border: '3px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}>
                      <RatMascot size={60} />
                    </div>
                  </div>

                  <h1 className="text-4xl font-black text-center text-[var(--foreground)] mb-3">
                    Learn a new language
                  </h1>
                  <p className="text-center text-[var(--muted)] text-lg max-w-md mx-auto">
                    Short, fun lessons designed to get you speaking fast.
                  </p>

                  <div className="flex items-center justify-center gap-8 mt-8">
                    {[
                      { label: 'Languages', value: String(LANGUAGES.length) },
                      { label: 'Lessons',   value: String(LANGUAGES.reduce((n, l) => n + l.units.reduce((u, unit) => u + unit.lessons.length, 0), 0)) },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="text-2xl font-black" style={{ color: 'var(--accent)' }}>{s.value}</p>
                        <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Language grid */}
            <div className="max-w-4xl mx-auto px-6 py-10">
              <DailyLangChallenge onStart={handleStartDaily} />

              {Object.keys(progress).length > 0 && (
                <div className="mb-10">
                  <h2 className="text-sm font-black uppercase tracking-widest text-[var(--muted)] mb-4">Continue Learning</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {LANGUAGES.filter((l) => (progress[l.id]?.completedLessons.length ?? 0) > 0).map((lang) => (
                      <LanguageCard key={lang.id} language={lang} progress={progress[lang.id]} onSelect={() => handleSelectLanguage(lang.id)} />
                    ))}
                  </div>
                </div>
              )}

              <LanguageStatsPanel progress={progress} />

              <h2 className="text-sm font-black uppercase tracking-widest text-[var(--muted)] mb-4">All Languages</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {LANGUAGES.map((lang) => (
                  <LanguageCard key={lang.id} language={lang} progress={progress[lang.id]} onSelect={() => handleSelectLanguage(lang.id)} />
                ))}
              </div>

              {/* Achievements strip */}
              {unlockedAch.size > 0 && (
                <div className="mt-12">
                  <h2 className="text-sm font-black uppercase tracking-widest text-[var(--muted)] mb-4">Your Achievements</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {ACHIEVEMENTS.filter((a) => unlockedAch.has(a.id)).map((a) => (
                      <div key={a.id} className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center"
                        style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '2px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)', color: 'var(--accent)' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        </div>
                        <p className="text-xs font-black text-[var(--foreground)]">{a.name}</p>
                        <p className="text-[10px] text-[var(--muted)] leading-tight">{a.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key={selectedLang.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }}>
            <SkillTreeView
              language={selectedLang}
              progress={progress[selectedLang.id]}
              audioOnly={audioOnly}
              onToggleAudio={toggleAudioOnly}
              onBack={() => { setSelectedLangId(null); localStorage.removeItem(ACTIVE_KEY) }}
              onLessonStart={(lesson) => setActiveLesson({ lesson, langId: selectedLang.id })}
              onReviewStart={(lesson) => setActiveLesson({ lesson, langId: selectedLang.id, isReview: true })}
              onCheckpointStart={(unit) => handleStartCheckpoint(selectedLang.id, unit)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lesson modal */}
      <AnimatePresence>
        {activeLesson && (
          <LessonModal
            lesson={activeLesson.lesson}
            langCode={activeLesson.langId}
            newAchievements={pendingAch}
            audioOnly={audioOnly}
            trackMistakesFor={activeLesson.langId}
            mode={activeLesson.checkpoint ? 'checkpoint' : 'lesson'}
            checkpointUnitId={activeLesson.checkpoint?.unitId}
            onComplete={(xp, perfect) => {
              handleLessonComplete(activeLesson.langId, activeLesson.lesson.id, xp, perfect, {
                isDailyChallenge: activeLesson.isDailyChallenge,
                isReview: activeLesson.isReview,
              })
              setPendingAch([])
            }}
            onClose={() => { setActiveLesson(null); setPendingAch([]) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
