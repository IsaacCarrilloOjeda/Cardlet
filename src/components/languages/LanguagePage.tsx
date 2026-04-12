'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LANGUAGES, type LanguageMeta, type Lesson } from './lessonData'
import { LessonModal } from './LessonModal'

// ─── colours ───────────────────────────────────────────────────────────────────
const G = {
  green: '#58CC02',
  greenDark: '#46A302',
  yellow: '#FFD900',
  red: '#FF4B4B',
  blue: '#1CB0F6',
}

// ─── progress helpers ──────────────────────────────────────────────────────────
interface LangProgress {
  completedLessons: string[]
  xp: number
  streak: number
}

const STORAGE_KEY = 'cardlet-lang-progress-v1'
const ACTIVE_KEY = 'cardlet-active-lang'

function loadProgress(): Record<string, LangProgress> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveProgress(p: Record<string, LangProgress>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

// ─── icon catalogue ────────────────────────────────────────────────────────────
function LessonIcon({ type, size = 26 }: { type: string; size?: number }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (type) {
    case 'greeting': return (
      <svg {...s}>
        <path d="M7 11.5V14.5M7 11.5C7 9.567 8.567 8 10.5 8C12.433 8 14 9.567 14 11.5V14M7 11.5C7 9.567 5.433 8 3.5 8M14 11.5V8.5M14 11.5C14 9.567 15.567 8 17.5 8M20 5H4C2.895 5 2 5.895 2 7V17C2 18.105 2.895 19 4 19H20C21.105 19 22 18.105 22 17V7C22 5.895 21.105 5 20 5Z" />
      </svg>
    )
    case 'numbers': return (
      <svg {...s}>
        <path d="M4 9H8M4 15H9M14 9H18M14 15H20M4 6V9M18 9V6M9 15V18M14 18V15" />
        <rect x="10" y="11" width="4" height="2" rx="1" />
      </svg>
    )
    case 'colors': return (
      <svg {...s}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3C12 3 7 7 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 12 3 12 3Z" fill="currentColor" opacity={0.3} />
      </svg>
    )
    case 'family': return (
      <svg {...s}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
    case 'food': return (
      <svg {...s}>
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    )
    case 'restaurant': return (
      <svg {...s}>
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
      </svg>
    )
    case 'conversation': return (
      <svg {...s}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
    case 'travel': return (
      <svg {...s}>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    )
    default: return (
      <svg {...s}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 3" />
      </svg>
    )
  }
}

// ─── Lock icon ─────────────────────────────────────────────────────────────────
function LockIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

// ─── language picker ───────────────────────────────────────────────────────────
function LanguageCard({
  language,
  progress,
  onSelect,
}: {
  language: LanguageMeta
  progress?: LangProgress
  onSelect: () => void
}) {
  const xp = progress?.xp ?? 0
  const lessons = progress?.completedLessons.length ?? 0
  const hasProgress = lessons > 0

  return (
    <motion.button
      whileHover={language.available ? { y: -3, scale: 1.01 } : {}}
      whileTap={language.available ? { scale: 0.98 } : {}}
      onClick={language.available ? onSelect : undefined}
      className="relative rounded-2xl overflow-hidden text-left transition-all focus:outline-none group"
      style={{
        background: 'var(--surface)',
        border: '2px solid var(--card-border)',
        cursor: language.available ? 'pointer' : 'default',
        opacity: language.available ? 1 : 0.7,
      }}
    >
      {/* Colour band */}
      <div
        className="h-20 flex items-center justify-center"
        style={{ background: `${language.color}22` }}
      >
        <span
          className="text-3xl font-black tracking-tight"
          style={{ color: language.color }}
        >
          {language.nativeName}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-[var(--foreground)] text-base">{language.name}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">{language.description}</p>
          </div>
          {!language.available && (
            <span className="shrink-0 mt-0.5 text-[var(--muted)]">
              <LockIcon size={16} />
            </span>
          )}
        </div>

        {language.available ? (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-[var(--muted)]">{language.learners}</span>
            {hasProgress ? (
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill={G.yellow} stroke={G.yellow} strokeWidth={1}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="text-xs font-bold" style={{ color: G.yellow }}>{xp} XP</span>
              </div>
            ) : (
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: `${language.color}20`, color: language.color }}
              >
                Start
              </span>
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

function LessonNode({
  lesson,
  nodeState,
  unitColor,
  unitDarkColor,
  onPress,
}: {
  lesson: Lesson
  nodeState: NodeState
  unitColor: string
  unitDarkColor: string
  onPress: () => void
}) {
  const isLocked = nodeState === 'locked'
  const isComplete = nodeState === 'completed'
  const isActive = nodeState === 'active'

  const bg = isComplete ? G.green : isLocked ? '#E5E5E5' : unitColor
  const dark = isComplete ? G.greenDark : isLocked ? '#AFAFAF' : unitDarkColor
  const iconColor = isLocked ? '#AFAFAF' : 'white'

  return (
    <div className="flex flex-col items-center gap-2">
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl px-3 py-1 text-xs font-black text-white"
          style={{ background: unitColor }}
        >
          START
          {/* Triangle pointer */}
          <span
            className="absolute left-1/2 -translate-x-1/2 top-full"
            style={{
              width: 0, height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${unitColor}`,
            }}
          />
        </motion.div>
      )}

      <motion.button
        whileTap={!isLocked ? { scale: 0.92, y: 4 } : {}}
        onClick={!isLocked ? onPress : undefined}
        className="relative flex items-center justify-center rounded-full transition-all focus:outline-none"
        style={{
          width: 72,
          height: 72,
          background: bg,
          boxShadow: isLocked ? 'none' : `0 6px 0 ${dark}`,
          cursor: isLocked ? 'not-allowed' : 'pointer',
        }}
        animate={isActive ? {
          boxShadow: [`0 6px 0 ${dark}`, `0 6px 16px ${unitColor}80`, `0 6px 0 ${dark}`],
        } : {}}
        transition={isActive ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
      >
        <span style={{ color: iconColor }}>
          {isComplete ? (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : isLocked ? (
            <LockIcon size={26} />
          ) : (
            <LessonIcon type={lesson.icon} size={30} />
          )}
        </span>
      </motion.button>

      <span
        className="text-xs font-bold text-center max-w-[80px] leading-tight"
        style={{ color: isLocked ? 'var(--muted)' : 'var(--foreground)' }}
      >
        {lesson.title}
      </span>
    </div>
  )
}

// ─── unit banner ───────────────────────────────────────────────────────────────
function UnitBanner({ title, subtitle, color, xp }: {
  title: string; subtitle: string; color: string; xp: number
}) {
  return (
    <div
      className="w-full rounded-2xl px-5 py-4 flex items-center justify-between"
      style={{ background: `${color}18`, border: `2px solid ${color}40` }}
    >
      <div>
        <p className="text-xs font-black uppercase tracking-widest" style={{ color }}>{title}</p>
        <p className="font-bold text-[var(--foreground)] text-base mt-0.5">{subtitle}</p>
      </div>
      {xp > 0 && (
        <div className="flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill={G.yellow} stroke={G.yellow} strokeWidth={1}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="text-sm font-black" style={{ color: G.yellow }}>{xp} XP</span>
        </div>
      )}
    </div>
  )
}

// snake path offset pattern
const SNAKE_OFFSETS = [0, 60, 96, 60, 0, -60, -96, -60]

// ─── skill tree view ───────────────────────────────────────────────────────────
function SkillTreeView({
  language,
  progress,
  onBack,
  onLessonStart,
}: {
  language: LanguageMeta
  progress?: LangProgress
  onBack: () => void
  onLessonStart: (lesson: Lesson) => void
}) {
  const completedLessons = new Set(progress?.completedLessons ?? [])
  const totalXp = progress?.xp ?? 0

  // flatten all lessons to find the "active" one
  const allLessons = language.units.flatMap((u) => u.lessons)
  const firstUncompletedIdx = allLessons.findIndex((l) => !completedLessons.has(l.id))
  const activeLessonId = firstUncompletedIdx >= 0 ? allLessons[firstUncompletedIdx].id : null

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b"
        style={{
          background: 'var(--background)/95',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--card-border)',
        }}
      >
        <button
          onClick={onBack}
          className="rounded-full p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>

        <div className="flex-1">
          <p className="font-black text-base text-[var(--foreground)]">{language.name}</p>
          <p className="text-xs text-[var(--muted)]">{language.nativeName}</p>
        </div>

        {/* XP */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: `${G.yellow}18` }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={G.yellow} stroke={G.yellow} strokeWidth={1}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="text-sm font-black" style={{ color: G.yellow }}>{totalXp}</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 text-sm font-bold text-[var(--muted)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.green} strokeWidth={2.5} strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span style={{ color: G.green }}>{completedLessons.size}</span>
          <span className="text-[var(--muted)]">/ {allLessons.length}</span>
        </div>
      </div>

      {/* Path */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-sm mx-auto flex flex-col gap-10">
          {language.units.map((unit, unitIdx) => {
            const unitXp = unit.lessons.reduce((acc, l) => acc + (completedLessons.has(l.id) ? l.xpReward : 0), 0)
            return (
              <div key={unit.id} className="flex flex-col gap-6">
                <UnitBanner
                  title={unit.title}
                  subtitle={unit.subtitle}
                  color={unit.color}
                  xp={unitXp}
                />

                {unit.locked ? (
                  <div
                    className="flex flex-col items-center gap-3 py-6 rounded-2xl border-2 border-dashed"
                    style={{ borderColor: 'var(--card-border)' }}
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--surface)', border: '2px solid var(--card-border)' }}
                    >
                      <LockIcon size={28} />
                    </div>
                    <p className="text-sm font-bold text-[var(--muted)]">Coming soon</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    {unit.lessons.map((lesson, lessonIdx) => {
                      const globalIdx = language.units
                        .slice(0, unitIdx)
                        .flatMap((u) => u.lessons)
                        .length + lessonIdx

                      const isComplete = completedLessons.has(lesson.id)
                      const isActive = lesson.id === activeLessonId
                      const isLocked = !isComplete && !isActive

                      const nodeState: NodeState = isComplete ? 'completed' : isActive ? 'active' : 'locked'
                      const offset = SNAKE_OFFSETS[globalIdx % SNAKE_OFFSETS.length]

                      return (
                        <div key={lesson.id} className="flex flex-col items-center w-full">
                          {/* Connector */}
                          {lessonIdx > 0 && (
                            <div
                              className="w-0"
                              style={{
                                height: 24,
                                borderLeft: '3px dashed var(--card-border)',
                              }}
                            />
                          )}

                          {/* Node */}
                          <div style={{ transform: `translateX(${offset}px)` }}>
                            <LessonNode
                              lesson={lesson}
                              nodeState={nodeState}
                              unitColor={unit.color}
                              unitDarkColor={unit.darkColor}
                              onPress={() => onLessonStart(lesson)}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* All done */}
          {activeLessonId === null && allLessons.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 py-8"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: `${G.yellow}20`, border: `3px solid ${G.yellow}` }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill={G.yellow}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
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
  const [progress, setProgress] = useState<Record<string, LangProgress>>({})
  const [activeLesson, setActiveLesson] = useState<{ lesson: Lesson; langId: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setProgress(loadProgress())
    const saved = localStorage.getItem(ACTIVE_KEY)
    if (saved) setSelectedLangId(saved)
    setMounted(true)
  }, [])

  function handleSelectLanguage(langId: string) {
    setSelectedLangId(langId)
    localStorage.setItem(ACTIVE_KEY, langId)
  }

  function handleLessonComplete(langId: string, lessonId: string, xpEarned: number) {
    setProgress((prev) => {
      const existing = prev[langId] ?? { completedLessons: [], xp: 0, streak: 0 }
      const updated: LangProgress = {
        ...existing,
        completedLessons: existing.completedLessons.includes(lessonId)
          ? existing.completedLessons
          : [...existing.completedLessons, lessonId],
        xp: existing.xp + xpEarned,
        streak: existing.streak + 1,
      }
      const next = { ...prev, [langId]: updated }
      saveProgress(next)
      return next
    })
    setActiveLesson(null)
  }

  const selectedLang = LANGUAGES.find((l) => l.id === selectedLangId)

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: G.green, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {!selectedLang ? (
          <motion.div
            key="picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            {/* Hero */}
            <div
              className="relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${G.green}18 0%, var(--background) 60%)`,
                borderBottom: '1px solid var(--card-border)',
              }}
            >
              <div className="max-w-4xl mx-auto px-6 pt-14 pb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  {/* Owl mascot */}
                  <div className="flex justify-center mb-6">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{ background: `${G.green}25`, border: `3px solid ${G.green}50` }}
                    >
                      <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
                        {/* Owl body */}
                        <ellipse cx="32" cy="40" rx="18" ry="20" fill={G.green} />
                        {/* Head */}
                        <circle cx="32" cy="22" r="16" fill={G.green} />
                        {/* Ear tufts */}
                        <path d="M22 10 L18 4 L24 8Z" fill={G.greenDark} />
                        <path d="M42 10 L46 4 L40 8Z" fill={G.greenDark} />
                        {/* Eyes */}
                        <circle cx="25" cy="22" r="7" fill="white" />
                        <circle cx="39" cy="22" r="7" fill="white" />
                        <circle cx="26" cy="22" r="4" fill="#1a1a2e" />
                        <circle cx="40" cy="22" r="4" fill="#1a1a2e" />
                        <circle cx="27" cy="21" r="1.5" fill="white" />
                        <circle cx="41" cy="21" r="1.5" fill="white" />
                        {/* Beak */}
                        <path d="M30 28 L32 32 L34 28 Z" fill={G.yellow} />
                        {/* Belly */}
                        <ellipse cx="32" cy="42" rx="11" ry="13" fill={G.greenDark} opacity={0.4} />
                        {/* Wings */}
                        <path d="M14 38 C8 32 10 44 16 46Z" fill={G.greenDark} />
                        <path d="M50 38 C56 32 54 44 48 46Z" fill={G.greenDark} />
                        {/* Feet */}
                        <path d="M24 58 L20 62 M24 58 L24 62 M24 58 L28 62" stroke={G.yellow} strokeWidth={2} strokeLinecap="round" />
                        <path d="M40 58 L36 62 M40 58 L40 62 M40 58 L44 62" stroke={G.yellow} strokeWidth={2} strokeLinecap="round" />
                        <line x1="24" y1="55" x2="24" y2="58" stroke={G.yellow} strokeWidth={2} />
                        <line x1="40" y1="55" x2="40" y2="58" stroke={G.yellow} strokeWidth={2} />
                      </svg>
                    </div>
                  </div>

                  <h1 className="text-4xl font-black text-center text-[var(--foreground)] mb-3">
                    Learn a new language
                  </h1>
                  <p className="text-center text-[var(--muted)] text-lg max-w-md mx-auto">
                    Short, fun lessons designed to get you speaking fast.
                  </p>

                  {/* Stats strip */}
                  <div className="flex items-center justify-center gap-8 mt-8">
                    {[
                      { label: 'Languages', value: '8' },
                      { label: 'Learners', value: '42M+' },
                      { label: 'Lessons', value: '12' },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="text-2xl font-black" style={{ color: G.green }}>{s.value}</p>
                        <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Language grid */}
            <div className="max-w-4xl mx-auto px-6 py-10">
              {/* Continue learning */}
              {Object.keys(progress).length > 0 && (
                <div className="mb-10">
                  <h2 className="text-sm font-black uppercase tracking-widest text-[var(--muted)] mb-4">
                    Continue Learning
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {LANGUAGES.filter((l) => progress[l.id]?.completedLessons.length > 0).map((lang) => (
                      <LanguageCard
                        key={lang.id}
                        language={lang}
                        progress={progress[lang.id]}
                        onSelect={() => handleSelectLanguage(lang.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <h2 className="text-sm font-black uppercase tracking-widest text-[var(--muted)] mb-4">
                All Languages
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {LANGUAGES.map((lang) => (
                  <LanguageCard
                    key={lang.id}
                    language={lang}
                    progress={progress[lang.id]}
                    onSelect={() => handleSelectLanguage(lang.id)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={selectedLang.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <SkillTreeView
              language={selectedLang}
              progress={progress[selectedLang.id]}
              onBack={() => {
                setSelectedLangId(null)
                localStorage.removeItem(ACTIVE_KEY)
              }}
              onLessonStart={(lesson) => setActiveLesson({ lesson, langId: selectedLang.id })}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lesson modal */}
      <AnimatePresence>
        {activeLesson && (
          <LessonModal
            lesson={activeLesson.lesson}
            onComplete={(xp) => handleLessonComplete(activeLesson.langId, activeLesson.lesson.id, xp)}
            onClose={() => setActiveLesson(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
