'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { type Lesson, type Exercise, checkTranslateAnswer } from './lessonData'

// ─── colour palette ────────────────────────────────────────────────────────────
const G = {
  green: '#58CC02',
  greenDark: '#46A302',
  greenBg: '#D7FFB8',
  red: '#FF4B4B',
  redDark: '#CC3C3C',
  redBg: '#FFDFE0',
  yellow: '#FFD900',
  blue: '#1CB0F6',
  gray: '#AFAFAF',
  grayDark: '#7B7B7B',
}

// ─── icons ─────────────────────────────────────────────────────────────────────
function HeartIcon({ filled = true }: { filled?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? G.red : 'none'} stroke={G.red} strokeWidth={2}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function StarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={G.yellow} stroke={G.yellow} strokeWidth={1}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ─── progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.min(100, (current / total) * 100)
  return (
    <div className="w-full h-4 rounded-full bg-[var(--card-border)] overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: G.green }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  )
}

// ─── multiple choice ──────────────────────────────────────────────────────────
function MultipleChoice({
  exercise,
  onAnswer,
}: {
  exercise: Extract<Exercise, { type: 'multipleChoice' }>
  onAnswer: (idx: number) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const correct = exercise.correctIndex

  function handleCheck() {
    if (selected === null) return
    setChecked(true)
    setTimeout(() => onAnswer(selected), 1200)
  }

  const optionStyle = (i: number) => {
    const base = 'w-full text-left px-5 py-4 rounded-xl border-2 font-semibold text-base transition-all duration-150 focus:outline-none'
    if (!checked) {
      return `${base} ${selected === i
        ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]'
        : 'border-[var(--card-border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-raised)]'
      }`
    }
    if (i === correct) return `${base} border-[${G.green}] text-[${G.green}]`
    if (i === selected && selected !== correct) return `${base} border-[${G.red}] text-[${G.red}]`
    return `${base} border-[var(--card-border)] text-[var(--muted)] opacity-50`
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: G.blue }}>
        Choose the correct answer
      </p>
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">{exercise.question}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {exercise.options.map((opt, i) => (
          <motion.button
            key={i}
            whileTap={!checked ? { scale: 0.97 } : {}}
            onClick={() => !checked && setSelected(i)}
            className={optionStyle(i)}
            style={{
              borderColor: checked && i === correct ? G.green
                : checked && i === selected && selected !== correct ? G.red
                : undefined,
              background: checked && i === correct ? G.greenBg
                : checked && i === selected && selected !== correct ? G.redBg
                : undefined,
              color: checked && i === correct ? G.greenDark
                : checked && i === selected && selected !== correct ? G.redDark
                : undefined,
            }}
          >
            {opt}
          </motion.button>
        ))}
      </div>

      <motion.button
        onClick={handleCheck}
        disabled={selected === null || checked}
        whileTap={selected !== null && !checked ? { scale: 0.97 } : {}}
        className="mt-4 w-full py-4 rounded-2xl font-bold text-lg transition-all"
        style={{
          background: selected !== null && !checked ? G.green : 'var(--card-border)',
          color: selected !== null && !checked ? 'white' : 'var(--muted)',
          boxShadow: selected !== null && !checked ? `0 4px 0 ${G.greenDark}` : 'none',
          cursor: selected === null || checked ? 'not-allowed' : 'pointer',
        }}
      >
        Check
      </motion.button>
    </div>
  )
}

// ─── translate ─────────────────────────────────────────────────────────────────
function TranslateExercise({
  exercise,
  onAnswer,
}: {
  exercise: Extract<Exercise, { type: 'translate' }>
  onAnswer: (correct: boolean) => void
}) {
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleCheck() {
    if (!value.trim()) return
    const correct = checkTranslateAnswer(value, exercise.answer, exercise.alternatives)
    setIsCorrect(correct)
    setChecked(true)
    setTimeout(() => onAnswer(correct), 1300)
  }

  const targetLabel = exercise.promptLang === 'en' ? 'Type in the target language' : 'Translate to English'
  const promptLabel = exercise.promptLang === 'en' ? 'Translate this phrase' : 'What does this mean?'

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: G.blue }}>
        {promptLabel}
      </p>
      <div
        className="rounded-2xl px-6 py-5 flex items-center gap-4"
        style={{ background: 'var(--surface-raised)', border: '2px solid var(--card-border)' }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: G.blue + '20' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={G.blue} strokeWidth={2}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-2xl font-bold text-[var(--foreground)]">{exercise.prompt}</p>
      </div>

      <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{targetLabel}</p>

      <input
        ref={inputRef}
        value={value}
        onChange={(e) => !checked && setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !checked && handleCheck()}
        placeholder="Type your answer…"
        className="w-full rounded-xl px-5 py-4 text-lg font-semibold border-2 bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none transition-colors"
        style={{
          borderColor: checked
            ? isCorrect ? G.green : G.red
            : 'var(--card-border)',
          background: checked
            ? isCorrect ? G.greenBg : G.redBg
            : undefined,
          color: checked ? (isCorrect ? G.greenDark : G.redDark) : undefined,
        }}
      />

      {checked && !isCorrect && (
        <p className="text-sm font-semibold" style={{ color: G.red }}>
          Correct answer:{' '}
          <span className="font-bold" style={{ color: G.greenDark }}>
            {exercise.answer}
          </span>
        </p>
      )}

      <motion.button
        onClick={handleCheck}
        disabled={!value.trim() || checked}
        whileTap={value.trim() && !checked ? { scale: 0.97 } : {}}
        className="mt-2 w-full py-4 rounded-2xl font-bold text-lg transition-all"
        style={{
          background: value.trim() && !checked ? G.green : 'var(--card-border)',
          color: value.trim() && !checked ? 'white' : 'var(--muted)',
          boxShadow: value.trim() && !checked ? `0 4px 0 ${G.greenDark}` : 'none',
          cursor: !value.trim() || checked ? 'not-allowed' : 'pointer',
        }}
      >
        Check
      </motion.button>
    </div>
  )
}

// ─── match pairs ───────────────────────────────────────────────────────────────
function MatchPairsExercise({
  exercise,
  onAnswer,
}: {
  exercise: Extract<Exercise, { type: 'matchPairs' }>
  onAnswer: () => void
}) {
  const shuffledRight = useMemo(() => {
    const arr = exercise.pairs.map((p, i) => ({ text: p[1], pairIndex: i }))
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [exercise.pairs])

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set())
  const [flashCorrect, setFlashCorrect] = useState<number | null>(null)
  const [flashWrong, setFlashWrong] = useState<{ left: number; right: number } | null>(null)

  function handleLeftClick(idx: number) {
    if (matchedPairs.has(idx)) return
    setSelectedLeft(idx)
  }

  function handleRightClick(shuffledIdx: number) {
    if (selectedLeft === null) return
    const rightItem = shuffledRight[shuffledIdx]
    if (matchedPairs.has(rightItem.pairIndex)) return

    if (rightItem.pairIndex === selectedLeft) {
      // Correct match
      const newMatched = new Set([...matchedPairs, selectedLeft])
      setFlashCorrect(selectedLeft)
      setTimeout(() => setFlashCorrect(null), 500)
      setSelectedLeft(null)
      setMatchedPairs(newMatched)
      if (newMatched.size === exercise.pairs.length) {
        setTimeout(() => onAnswer(), 700)
      }
    } else {
      // Wrong match
      setFlashWrong({ left: selectedLeft, right: shuffledIdx })
      setTimeout(() => {
        setFlashWrong(null)
        setSelectedLeft(null)
      }, 700)
    }
  }

  const leftStyle = (i: number) => {
    const matched = matchedPairs.has(i)
    const selected = selectedLeft === i
    const wrongFlash = flashWrong?.left === i
    const correctFlash = flashCorrect === i
    return {
      background: matched ? G.greenBg
        : correctFlash ? G.greenBg
        : wrongFlash ? G.redBg
        : selected ? 'var(--accent)' + '20'
        : 'var(--surface)',
      borderColor: matched ? G.green
        : correctFlash ? G.green
        : wrongFlash ? G.red
        : selected ? 'var(--accent)'
        : 'var(--card-border)',
      color: matched ? G.greenDark : wrongFlash ? G.redDark : 'var(--foreground)',
      opacity: matched ? 0.7 : 1,
    }
  }

  const rightStyle = (shuffledIdx: number) => {
    const item = shuffledRight[shuffledIdx]
    const matched = matchedPairs.has(item.pairIndex)
    const wrongFlash = flashWrong?.right === shuffledIdx
    const correctFlash = flashCorrect === item.pairIndex
    return {
      background: matched ? G.greenBg
        : correctFlash ? G.greenBg
        : wrongFlash ? G.redBg
        : 'var(--surface)',
      borderColor: matched ? G.green
        : correctFlash ? G.green
        : wrongFlash ? G.red
        : 'var(--card-border)',
      color: matched ? G.greenDark : wrongFlash ? G.redDark : 'var(--foreground)',
      opacity: matched ? 0.7 : 1,
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: G.blue }}>
        Tap the matching pairs
      </p>
      <h2 className="text-xl font-bold text-[var(--foreground)]">Match each word to its translation</h2>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="flex flex-col gap-2">
          {exercise.pairs.map((pair, i) => (
            <motion.button
              key={i}
              whileTap={!matchedPairs.has(i) ? { scale: 0.96 } : {}}
              onClick={() => handleLeftClick(i)}
              className="px-4 py-3 rounded-xl border-2 font-semibold text-sm text-left transition-all duration-150 focus:outline-none"
              style={leftStyle(i)}
              disabled={matchedPairs.has(i)}
            >
              {pair[0]}
            </motion.button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {shuffledRight.map((item, i) => (
            <motion.button
              key={i}
              whileTap={!matchedPairs.has(item.pairIndex) ? { scale: 0.96 } : {}}
              onClick={() => handleRightClick(i)}
              className="px-4 py-3 rounded-xl border-2 font-semibold text-sm text-left transition-all duration-150 focus:outline-none"
              style={rightStyle(i)}
              disabled={matchedPairs.has(item.pairIndex)}
            >
              {item.text}
            </motion.button>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-[var(--muted)] mt-2">
        {matchedPairs.size} / {exercise.pairs.length} matched
      </p>
    </div>
  )
}

// ─── completion screen ─────────────────────────────────────────────────────────
function CompletionScreen({
  xpEarned,
  heartsLeft,
  onContinue,
}: {
  xpEarned: number
  heartsLeft: number
  onContinue: () => void
}) {
  const [counted, setCounted] = useState(0)

  useEffect(() => {
    let start = 0
    const step = Math.ceil(xpEarned / 30)
    const timer = setInterval(() => {
      start = Math.min(start + step, xpEarned)
      setCounted(start)
      if (start >= xpEarned) clearInterval(timer)
    }, 40)
    return () => clearInterval(timer)
  }, [xpEarned])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-8 py-6"
    >
      {/* Animated trophy */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="w-28 h-28 rounded-full flex items-center justify-center"
        style={{ background: `${G.yellow}30`, border: `4px solid ${G.yellow}` }}
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill={G.yellow} stroke={G.yellow} strokeWidth={1}>
          <path d="M8 21h8M12 17v4M17 3H7L5 7c0 3.87 3.13 7 7 7s7-3.13 7-7l-2-4zM5 7H3M19 7h2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h2 className="text-3xl font-black text-[var(--foreground)] mb-1">Lesson Complete!</h2>
        <p className="text-[var(--muted)] text-base">You're on a roll. Keep it up!</p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-2 gap-4 w-full max-w-xs"
      >
        <div
          className="flex flex-col items-center gap-1 rounded-2xl py-4 px-3"
          style={{ background: `${G.yellow}18`, border: `2px solid ${G.yellow}40` }}
        >
          <div className="flex items-center gap-1">
            <StarIcon size={20} />
            <span className="text-2xl font-black" style={{ color: G.yellow }}>{counted}</span>
          </div>
          <span className="text-xs font-bold text-[var(--muted)]">XP Earned</span>
        </div>

        <div
          className="flex flex-col items-center gap-1 rounded-2xl py-4 px-3"
          style={{ background: `${G.red}18`, border: `2px solid ${G.red}40` }}
        >
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 3 }, (_, i) => (
              <HeartIcon key={i} filled={i < heartsLeft} />
            ))}
          </div>
          <span className="text-xs font-bold text-[var(--muted)]">Hearts Left</span>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={onContinue}
        whileTap={{ scale: 0.97 }}
        className="w-full max-w-xs py-4 rounded-2xl font-black text-lg text-white transition-all"
        style={{
          background: G.green,
          boxShadow: `0 5px 0 ${G.greenDark}`,
        }}
      >
        Continue
      </motion.button>
    </motion.div>
  )
}

// ─── main lesson modal ─────────────────────────────────────────────────────────
interface LessonModalProps {
  lesson: Lesson
  onComplete: (xpEarned: number) => void
  onClose: () => void
}

export function LessonModal({ lesson, onComplete, onClose }: LessonModalProps) {
  const [exerciseIdx, setExerciseIdx] = useState(0)
  const [hearts, setHearts] = useState(3)
  const [xpEarned, setXpEarned] = useState(0)
  const [phase, setPhase] = useState<'lesson' | 'complete'>('lesson')
  const [feedbackVisible, setFeedbackVisible] = useState(false)
  const [feedbackCorrect, setFeedbackCorrect] = useState(false)
  const [exerciseKey, setExerciseKey] = useState(0)

  const exercises = lesson.exercises
  const currentExercise = exercises[exerciseIdx]
  const totalExercises = exercises.length

  function advance(wasCorrect: boolean) {
    if (!wasCorrect) {
      setHearts((h) => Math.max(0, h - 1))
    } else {
      setXpEarned((x) => x + Math.floor(lesson.xpReward / totalExercises))
    }
    setFeedbackCorrect(wasCorrect)
    setFeedbackVisible(true)
  }

  function handleContinue() {
    setFeedbackVisible(false)
    if (exerciseIdx + 1 >= totalExercises) {
      const finalXp = Math.round(lesson.xpReward * (0.5 + (hearts / 6)))
      setXpEarned(finalXp)
      setPhase('complete')
    } else {
      setExerciseIdx((i) => i + 1)
      setExerciseKey((k) => k + 1)
    }
  }

  function handleMatchComplete() {
    setXpEarned((x) => x + Math.floor(lesson.xpReward / totalExercises))
    // matchPairs auto-advances internally, so we just go to next
    if (exerciseIdx + 1 >= totalExercises) {
      const finalXp = Math.round(lesson.xpReward * (0.5 + (hearts / 6)))
      setXpEarned(finalXp)
      setPhase('complete')
    } else {
      setExerciseIdx((i) => i + 1)
      setExerciseKey((k) => k + 1)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{ background: 'var(--surface)', maxHeight: '95dvh' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[var(--card-border)] shrink-0">
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {phase === 'lesson' && (
            <div className="flex-1">
              <ProgressBar current={exerciseIdx} total={totalExercises} />
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0">
            {Array.from({ length: 3 }, (_, i) => (
              <HeartIcon key={i} filled={i < hearts} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          <AnimatePresence mode="wait">
            {phase === 'complete' ? (
              <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CompletionScreen
                  xpEarned={xpEarned}
                  heartsLeft={hearts}
                  onContinue={() => onComplete(xpEarned)}
                />
              </motion.div>
            ) : (
              <motion.div
                key={exerciseKey}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
              >
                {currentExercise.type === 'multipleChoice' && (
                  <MultipleChoice
                    exercise={currentExercise}
                    onAnswer={(idx) => advance(idx === currentExercise.correctIndex)}
                  />
                )}
                {currentExercise.type === 'translate' && (
                  <TranslateExercise
                    exercise={currentExercise}
                    onAnswer={(correct) => advance(correct)}
                  />
                )}
                {currentExercise.type === 'matchPairs' && (
                  <MatchPairsExercise
                    exercise={currentExercise}
                    onAnswer={handleMatchComplete}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Feedback bar */}
        <AnimatePresence>
          {feedbackVisible && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="shrink-0 px-5 py-5 border-t-2"
              style={{
                background: feedbackCorrect ? G.greenBg : G.redBg,
                borderColor: feedbackCorrect ? G.green : G.red,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: feedbackCorrect ? G.green : G.red }}
                  >
                    {feedbackCorrect ? <CheckIcon /> : <XIcon />}
                  </div>
                  <div>
                    <p
                      className="font-black text-base"
                      style={{ color: feedbackCorrect ? G.greenDark : G.redDark }}
                    >
                      {feedbackCorrect ? 'Correct!' : 'Not quite!'}
                    </p>
                    <p className="text-sm" style={{ color: feedbackCorrect ? G.greenDark : G.redDark, opacity: 0.8 }}>
                      {feedbackCorrect ? 'Keep it up!' : 'No worries, try to remember it.'}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleContinue}
                  className="px-6 py-3 rounded-2xl font-black text-white text-base"
                  style={{
                    background: feedbackCorrect ? G.green : G.red,
                    boxShadow: `0 4px 0 ${feedbackCorrect ? G.greenDark : G.redDark}`,
                  }}
                >
                  Continue
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
