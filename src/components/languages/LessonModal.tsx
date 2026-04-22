'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  type Lesson, type Exercise, type Achievement,
  checkTranslateAnswer, DISTRACTORS, SPEECH_LANG,
} from './lessonData'
import {
  MAX_HEARTS, HEART_REFILL_COST,
  getCurrentHearts, loseHeart, refillAllHearts,
  bumpStreak, addDailyXp, logMistake, clearMistake,
  markCheckpointPassed,
} from './storage'
import { useCredits } from '@/components/layout/CreditsContext'
import { pairFromExercise } from './vocab'

// ─── palette ──────────────────────────────────────────────────────────────────
const G = {
  green: '#58CC02', greenDark: '#46A302', greenBg: '#D7FFB8',
  red: '#FF4B4B',   redDark: '#CC3C3C',   redBg:   '#FFDFE0',
  yellow: '#FFD900', blue: '#1CB0F6',
}

// ─── speech ────────────────────────────────────────────────────────────────────
function speak(text: string, langCode: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = SPEECH_LANG[langCode] ?? 'en-US'
  u.rate = 0.82
  if (onEnd) u.onend = onEnd
  window.speechSynthesis.speak(u)
}

// ─── hint mask ────────────────────────────────────────────────────────────────
function buildHintMask(answer: string, revealed: number): string {
  let lettersSeen = 0
  return answer
    .split('')
    .map((ch) => {
      if (ch === ' ') return '  '
      const show = lettersSeen < revealed
      lettersSeen++
      return show ? ch : '_'
    })
    .join(' ')
}

// ─── confetti ─────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#58CC02','#FFD900','#FF4B4B','#1CB0F6','#CE82FF','#FF9600']

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')!

    type Particle = {
      x: number; y: number; vx: number; vy: number
      w: number; h: number; rot: number; drot: number; color: string; life: number
    }

    const particles: Particle[] = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      w: 8 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      rot: Math.random() * Math.PI * 2,
      drot: (Math.random() - 0.5) * 0.2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      life: 1,
    }))

    let frame: number
    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height)
      let alive = false
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.rot += p.drot
        if (p.y > canvas!.height) { p.life = 0; continue }
        alive = true
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.min(1, p.life)
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }
      if (alive) frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  )
}

// ─── audio button ─────────────────────────────────────────────────────────────
function AudioButton({ text, langCode }: { text: string; langCode: string }) {
  const [playing, setPlaying] = useState(false)
  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    setPlaying(true)
    speak(text, langCode, () => setPlaying(false))
  }
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className="relative flex items-center justify-center rounded-full transition-colors focus:outline-none"
      style={{
        width: 44, height: 44,
        background: playing ? `${G.blue}25` : 'var(--surface-raised)',
        border: `2px solid ${playing ? G.blue : 'var(--card-border)'}`,
      }}
      title="Listen"
    >
      {playing && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${G.blue}` }}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={playing ? G.blue : 'var(--muted)'} strokeWidth={2} strokeLinecap="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        {playing
          ? <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
          : <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
      </svg>
    </motion.button>
  )
}

// ─── achievement icon ─────────────────────────────────────────────────────────
function AchievementIcon({ icon, size = 24 }: { icon: Achievement['icon']; size?: number }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (icon) {
    case 'star':      return <svg {...s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" /></svg>
    case 'fire':      return <svg {...s}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" fill="currentColor" /></svg>
    case 'lightning': return <svg {...s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" /></svg>
    case 'trophy':    return <svg {...s}><path d="M8 21h8M12 17v4M17 3H7L5 7c0 3.87 3.13 7 7 7s7-3.13 7-7l-2-4z" /><path d="M5 7H3M19 7h2" /></svg>
    case 'book':      return <svg {...s}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
    case 'crown':     return <svg {...s}><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" fill="currentColor" /><path d="M5 20h14" /></svg>
    case 'heart':     return <svg {...s}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor" /></svg>
    case 'globe':     return <svg {...s}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
    default: return null
  }
}

// ─── multiple choice ──────────────────────────────────────────────────────────
function MultipleChoice({
  exercise, langCode, feedbackVisible,
  onAnswer,
}: {
  exercise: Extract<Exercise, { type: 'multipleChoice' }>
  langCode: string
  feedbackVisible: boolean
  onAnswer: (idx: number) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const correct = exercise.correctIndex

  const doCheck = useCallback(() => {
    if (selected === null || checked) return
    setChecked(true)
    setTimeout(() => onAnswer(selected), 1100)
  }, [selected, checked, onAnswer])

  // keyboard: 1-4 to select, Enter/Space to check
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (feedbackVisible || checked) return
      if (['1', '2', '3', '4'].includes(e.key)) {
        const i = parseInt(e.key) - 1
        if (i < exercise.options.length) setSelected(i)
      }
      if ((e.key === 'Enter' || e.key === ' ') && selected !== null) {
        e.preventDefault()
        doCheck()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selected, checked, feedbackVisible, doCheck, exercise.options.length])

  const optStyle = (i: number) => {
    const base = 'w-full text-left px-5 py-4 rounded-xl border-2 font-semibold text-base transition-all duration-150 focus:outline-none'
    if (!checked) {
      return `${base} ${selected === i
        ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]'
        : 'border-[var(--card-border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--accent)]/50'}`
    }
    return base
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: G.blue }}>
        Choose the correct answer  <span className="ml-2 text-[var(--muted)] normal-case font-normal tracking-normal">or press 1 – 4</span>
      </p>

      <div className="flex items-start gap-3">
        <h2 className="text-2xl font-bold text-[var(--foreground)] flex-1">{exercise.question}</h2>
        <AudioButton text={exercise.question} langCode={langCode} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
        {exercise.options.map((opt, i) => (
          <motion.button
            key={i}
            whileTap={!checked ? { scale: 0.97 } : {}}
            onClick={() => !checked && setSelected(i)}
            className={optStyle(i)}
            style={checked ? {
              borderColor: i === correct ? G.green : (i === selected && selected !== correct ? G.red : 'var(--card-border)'),
              background:  i === correct ? G.greenBg : (i === selected && selected !== correct ? G.redBg : undefined),
              color:       i === correct ? G.greenDark : (i === selected && selected !== correct ? G.redDark : 'var(--muted)'),
              opacity: checked && i !== correct && i !== selected ? 0.5 : 1,
            } : undefined}
          >
            <span className="mr-2 text-[var(--muted)] text-sm">{i + 1}.</span>{opt}
          </motion.button>
        ))}
      </div>

      <motion.button
        onClick={doCheck}
        disabled={selected === null || checked}
        whileTap={selected !== null && !checked ? { scale: 0.97 } : {}}
        className="mt-2 w-full py-4 rounded-2xl font-bold text-lg transition-all"
        style={{
          background: selected !== null && !checked ? G.green : 'var(--card-border)',
          color:      selected !== null && !checked ? 'white' : 'var(--muted)',
          boxShadow:  selected !== null && !checked ? `0 4px 0 ${G.greenDark}` : 'none',
          cursor:     selected === null || checked ? 'not-allowed' : 'pointer',
        }}
      >
        Check <span className="ml-1 text-sm opacity-60 font-normal">↵</span>
      </motion.button>
    </div>
  )
}

// ─── translate ─────────────────────────────────────────────────────────────────
function TranslateExercise({
  exercise, langCode, feedbackVisible,
  onAnswer, onHintUsed,
}: {
  exercise: Extract<Exercise, { type: 'translate' }>
  langCode: string
  feedbackVisible: boolean
  onAnswer: (correct: boolean) => void
  onHintUsed: () => void
}) {
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [hintsRevealed, setHintsRevealed] = useState(0)
  const [wordBankMode, setWordBankMode] = useState(false)
  const [selectedTiles, setSelectedTiles] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const MAX_HINTS = exercise.answer.replace(/ /g, '').length

  // word bank tiles
  const allTiles = useMemo(() => {
    const answerWords = exercise.answer.split(' ')
    const pool = DISTRACTORS[langCode] ?? []
    const distractors = pool.filter((d) => !answerWords.includes(d)).slice(0, 3)
    const tiles = [...answerWords, ...distractors]
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]]
    }
    return tiles
  }, [exercise.answer, langCode])

  const usedTiles = useMemo(() => new Set(selectedTiles), [selectedTiles])
  const currentAnswer = wordBankMode ? selectedTiles.join(' ') : value

  useEffect(() => {
    if (!wordBankMode) inputRef.current?.focus()
  }, [wordBankMode])

  function doCheck() {
    if (!currentAnswer.trim() || checked) return
    const correct = checkTranslateAnswer(currentAnswer, exercise.answer, exercise.alternatives)
    setIsCorrect(correct)
    setChecked(true)
    setTimeout(() => onAnswer(correct), 1200)
  }

  function addHint() {
    if (hintsRevealed >= MAX_HINTS) return
    setHintsRevealed((h) => h + 1)
    onHintUsed()
    if (!wordBankMode) inputRef.current?.focus()
  }

  function toggleWordBank() {
    setWordBankMode((m) => !m)
    setValue('')
    setSelectedTiles([])
  }

  function tapTile(tile: string, idx: number) {
    // find the first unused occurrence of this tile in allTiles
    const tileKey = `${tile}::${idx}`
    if (usedTiles.has(tileKey)) return
    setSelectedTiles((prev) => [...prev, tile])
    usedTiles.add(tileKey)
  }

  function removeTile(idx: number) {
    setSelectedTiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const speakText = exercise.promptLang === 'target' ? exercise.prompt : exercise.answer
  const speakLang = exercise.promptLang === 'target' ? langCode : 'en'

  // after check, Enter/Space is handled by parent LessonModal
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (feedbackVisible || checked || wordBankMode) return
      if (e.key === 'Enter') { e.preventDefault(); doCheck() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [feedbackVisible, checked, wordBankMode, currentAnswer])

  const hintMask = hintsRevealed > 0 ? buildHintMask(exercise.answer, hintsRevealed) : null
  const borderColor = checked ? (isCorrect ? G.green : G.red) : 'var(--card-border)'
  const bgColor     = checked ? (isCorrect ? G.greenBg : G.redBg) : undefined

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: G.blue }}>
          {exercise.promptLang === 'en' ? 'Translate this phrase' : 'What does this mean?'}
        </p>
        {/* Mode toggle */}
        <button
          onClick={toggleWordBank}
          className="text-xs font-bold px-3 py-1 rounded-full border transition-colors"
          style={{
            borderColor: 'var(--card-border)',
            color: wordBankMode ? G.blue : 'var(--muted)',
            background: wordBankMode ? `${G.blue}15` : 'transparent',
          }}
        >
          {wordBankMode ? 'Use keyboard' : 'Word bank'}
        </button>
      </div>

      {/* Prompt card */}
      <div
        className="rounded-2xl px-5 py-4 flex items-center gap-4"
        style={{ background: 'var(--surface-raised)', border: '2px solid var(--card-border)' }}
      >
        <AudioButton text={speakText} langCode={speakLang} />
        <p className="text-2xl font-bold text-[var(--foreground)]">{exercise.prompt}</p>
      </div>

      {/* Hint display */}
      {hintMask && (
        <p className="text-sm font-mono tracking-widest text-center" style={{ color: G.blue }}>
          {hintMask}
        </p>
      )}

      {wordBankMode ? (
        <>
          {/* Selected tiles / answer area */}
          <div
            className="min-h-[52px] rounded-xl border-2 p-3 flex flex-wrap gap-2 items-center"
            style={{ borderColor, background: bgColor ?? 'var(--surface)' }}
          >
            {selectedTiles.length === 0 && (
              <span className="text-sm text-[var(--muted)]">Tap words below to build your answer…</span>
            )}
            {selectedTiles.map((tile, i) => (
              <motion.button
                key={i}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => !checked && removeTile(i)}
                className="px-3 py-1.5 rounded-lg border-2 font-semibold text-sm transition-all"
                style={{
                  borderColor: checked ? (isCorrect ? G.green : G.red) : 'var(--accent)',
                  background: 'var(--surface-raised)',
                  color: checked ? (isCorrect ? G.greenDark : G.redDark) : 'var(--foreground)',
                }}
              >
                {tile}
              </motion.button>
            ))}
          </div>

          {/* Word bank pool */}
          {!checked && (
            <div className="flex flex-wrap gap-2 justify-center py-2">
              {allTiles.map((tile, i) => {
                const tileKey = `${tile}::${i}`
                const used = usedTiles.has(tileKey)
                return (
                  <motion.button
                    key={i}
                    whileTap={!used ? { scale: 0.93 } : {}}
                    onClick={() => !used && tapTile(tile, i)}
                    className="px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-all"
                    style={{
                      borderColor: used ? 'var(--card-border)' : 'var(--card-border)',
                      background: used ? 'transparent' : 'var(--surface)',
                      color: used ? 'transparent' : 'var(--foreground)',
                      boxShadow: used ? 'none' : '0 3px 0 var(--card-border)',
                      cursor: used ? 'default' : 'pointer',
                    }}
                  >
                    {tile}
                  </motion.button>
                )
              })}
            </div>
          )}

          {checked && !isCorrect && (
            <p className="text-sm font-semibold text-center" style={{ color: G.red }}>
              Correct answer: <span className="font-bold" style={{ color: G.greenDark }}>{exercise.answer}</span>
            </p>
          )}
        </>
      ) : (
        <>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => !checked && setValue(e.target.value)}
            placeholder="Type your answer…"
            className="w-full rounded-xl px-5 py-4 text-lg font-semibold border-2 bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none transition-colors"
            style={{
              borderColor,
              background: bgColor,
              color: checked ? (isCorrect ? G.greenDark : G.redDark) : undefined,
            }}
          />
          {checked && !isCorrect && (
            <p className="text-sm font-semibold" style={{ color: G.red }}>
              Correct answer: <span className="font-bold" style={{ color: G.greenDark }}>{exercise.answer}</span>
            </p>
          )}
        </>
      )}

      {/* Controls row */}
      <div className="flex gap-3">
        {/* Hint button */}
        {!checked && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={addHint}
            disabled={hintsRevealed >= MAX_HINTS}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl font-semibold text-sm border-2 transition-all"
            style={{
              borderColor: hintsRevealed >= MAX_HINTS ? 'var(--card-border)' : G.yellow,
              color: hintsRevealed >= MAX_HINTS ? 'var(--muted)' : G.yellow,
              background: hintsRevealed >= MAX_HINTS ? 'transparent' : `${G.yellow}15`,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            Hint {hintsRevealed > 0 && `(${hintsRevealed})`}
          </motion.button>
        )}

        {/* Check button */}
        <motion.button
          onClick={doCheck}
          disabled={!currentAnswer.trim() || checked}
          whileTap={currentAnswer.trim() && !checked ? { scale: 0.97 } : {}}
          className="flex-1 py-3 rounded-2xl font-bold text-lg transition-all"
          style={{
            background: currentAnswer.trim() && !checked ? G.green : 'var(--card-border)',
            color:      currentAnswer.trim() && !checked ? 'white' : 'var(--muted)',
            boxShadow:  currentAnswer.trim() && !checked ? `0 4px 0 ${G.greenDark}` : 'none',
            cursor:     !currentAnswer.trim() || checked ? 'not-allowed' : 'pointer',
          }}
        >
          Check <span className="ml-1 text-sm opacity-60 font-normal">↵</span>
        </motion.button>
      </div>
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

  function handleRightClick(shuffledIdx: number) {
    if (selectedLeft === null) return
    const item = shuffledRight[shuffledIdx]
    if (matchedPairs.has(item.pairIndex)) return
    if (item.pairIndex === selectedLeft) {
      const next = new Set([...matchedPairs, selectedLeft])
      setFlashCorrect(selectedLeft)
      setTimeout(() => setFlashCorrect(null), 500)
      setSelectedLeft(null)
      setMatchedPairs(next)
      if (next.size === exercise.pairs.length) setTimeout(() => onAnswer(), 700)
    } else {
      setFlashWrong({ left: selectedLeft, right: shuffledIdx })
      setTimeout(() => { setFlashWrong(null); setSelectedLeft(null) }, 700)
    }
  }

  const lStyle = (i: number) => ({
    background: matchedPairs.has(i) || flashCorrect === i ? G.greenBg
      : flashWrong?.left === i ? G.redBg
      : selectedLeft === i ? `${G.blue}18` : 'var(--surface)',
    borderColor: matchedPairs.has(i) || flashCorrect === i ? G.green
      : flashWrong?.left === i ? G.red
      : selectedLeft === i ? G.blue : 'var(--card-border)',
    color: matchedPairs.has(i) || flashCorrect === i ? G.greenDark
      : flashWrong?.left === i ? G.redDark : 'var(--foreground)',
    opacity: matchedPairs.has(i) ? 0.65 : 1,
  })

  const rStyle = (si: number) => {
    const item = shuffledRight[si]
    return {
      background: matchedPairs.has(item.pairIndex) || flashCorrect === item.pairIndex ? G.greenBg
        : flashWrong?.right === si ? G.redBg : 'var(--surface)',
      borderColor: matchedPairs.has(item.pairIndex) || flashCorrect === item.pairIndex ? G.green
        : flashWrong?.right === si ? G.red : 'var(--card-border)',
      color: matchedPairs.has(item.pairIndex) || flashCorrect === item.pairIndex ? G.greenDark
        : flashWrong?.right === si ? G.redDark : 'var(--foreground)',
      opacity: matchedPairs.has(item.pairIndex) ? 0.65 : 1,
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: G.blue }}>
        Tap the matching pairs
      </p>
      <h2 className="text-xl font-bold text-[var(--foreground)]">Match each word to its translation</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {exercise.pairs.map((pair, i) => (
            <motion.button key={i} whileTap={!matchedPairs.has(i) ? { scale: 0.96 } : {}}
              onClick={() => !matchedPairs.has(i) && setSelectedLeft(i)}
              className="px-4 py-3 rounded-xl border-2 font-semibold text-sm text-left transition-all focus:outline-none"
              style={lStyle(i)} disabled={matchedPairs.has(i)}>
              {pair[0]}
            </motion.button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {shuffledRight.map((item, i) => (
            <motion.button key={i} whileTap={!matchedPairs.has(item.pairIndex) ? { scale: 0.96 } : {}}
              onClick={() => handleRightClick(i)}
              className="px-4 py-3 rounded-xl border-2 font-semibold text-sm text-left transition-all focus:outline-none"
              style={rStyle(i)} disabled={matchedPairs.has(item.pairIndex)}>
              {item.text}
            </motion.button>
          ))}
        </div>
      </div>
      <p className="text-center text-sm text-[var(--muted)]">
        {matchedPairs.size} / {exercise.pairs.length} matched
      </p>
    </div>
  )
}

// ─── completion screen ─────────────────────────────────────────────────────────
function CompletionScreen({
  xpEarned, heartsLeft, hintsUsed, perfect, newAchievements, onContinue,
}: {
  xpEarned: number; heartsLeft: number; hintsUsed: number
  perfect: boolean; newAchievements: Achievement[]; onContinue: () => void
}) {
  const [counted, setCounted] = useState(0)

  useEffect(() => {
    let v = 0
    const step = Math.max(1, Math.ceil(xpEarned / 30))
    const t = setInterval(() => {
      v = Math.min(v + step, xpEarned)
      setCounted(v)
      if (v >= xpEarned) clearInterval(t)
    }, 40)
    return () => clearInterval(t)
  }, [xpEarned])

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 py-4">

      <motion.div
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="w-24 h-24 rounded-full flex items-center justify-center"
        style={{ background: `${perfect ? G.yellow : G.green}25`, border: `4px solid ${perfect ? G.yellow : G.green}` }}>
        {perfect ? (
          <svg width="48" height="48" viewBox="0 0 24 24" fill={G.yellow} stroke={G.yellow} strokeWidth={1}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ) : (
          <svg width="44" height="44" viewBox="0 0 24 24" fill={G.green}>
            <path d="M8 21h8M12 17v4M17 3H7L5 7c0 3.87 3.13 7 7 7s7-3.13 7-7l-2-4zM5 7H3M19 7h2" strokeLinecap="round" strokeLinejoin="round" stroke={G.greenDark} strokeWidth={1.5} />
          </svg>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }} className="text-center">
        <h2 className="text-3xl font-black text-[var(--foreground)]">
          {perfect ? 'Perfect Lesson!' : 'Lesson Complete!'}
        </h2>
        <p className="text-[var(--muted)] mt-1">
          {perfect ? 'Flawless — no hearts lost!' : 'You\'re on a roll. Keep it up!'}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }} className="grid grid-cols-3 gap-3 w-full">
        {[
          { label: 'XP Earned', value: counted, color: G.yellow,
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill={G.yellow}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> },
          { label: 'Hearts', value: `${heartsLeft}/${MAX_HEARTS}`, color: G.red,
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill={G.red}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> },
          { label: 'Hints', value: hintsUsed === 0 ? '0' : `-${hintsUsed * 3} XP`, color: G.yellow,
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G.yellow} strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg> },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1 rounded-2xl py-3 px-2"
            style={{ background: `${s.color}15`, border: `2px solid ${s.color}35` }}>
            {s.icon}
            <span className="text-xl font-black" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">{s.label}</span>
          </div>
        ))}
      </motion.div>

      {/* New achievements */}
      {newAchievements.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }} className="w-full">
          <p className="text-xs font-black uppercase tracking-widest text-center mb-3"
            style={{ color: G.yellow }}>
            Achievement Unlocked!
          </p>
          <div className="flex flex-col gap-2">
            {newAchievements.map((a) => (
              <div key={a.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: `${G.yellow}18`, border: `2px solid ${G.yellow}50` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${G.yellow}30`, color: G.yellow }}>
                  <AchievementIcon icon={a.icon} size={18} />
                </div>
                <div>
                  <p className="font-black text-sm text-[var(--foreground)]">{a.name}</p>
                  <p className="text-xs text-[var(--muted)]">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }} onClick={onContinue} whileTap={{ scale: 0.97 }}
        className="w-full py-4 rounded-2xl font-black text-lg text-white"
        style={{ background: G.green, boxShadow: `0 5px 0 ${G.greenDark}` }}>
        Continue <span className="ml-1 text-sm opacity-60 font-normal">↵</span>
      </motion.button>
    </motion.div>
  )
}

// ─── progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full h-3.5 rounded-full bg-[var(--card-border)] overflow-hidden">
      <motion.div className="h-full rounded-full" style={{ background: G.green }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (current / total) * 100)}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }} />
    </div>
  )
}

// ─── hearts ────────────────────────────────────────────────────────────────────
function Heart({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24"
      fill={filled ? G.red : 'none'} stroke={G.red} strokeWidth={2}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

// ─── out of hearts ─────────────────────────────────────────────────────────────
function OutOfHeartsScreen({
  credits, onRefill, onQuit,
}: { credits: number; onRefill: () => void; onQuit: () => void }) {
  const [msToNext, setMsToNext] = useState(0)
  useEffect(() => {
    const tick = () => setMsToNext(getCurrentHearts().msToNext)
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  const canRefill = credits >= HEART_REFILL_COST
  const minLeft = Math.max(0, Math.ceil(msToNext / 60000))
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-5 py-2">
      <div className="w-24 h-24 rounded-full flex items-center justify-center"
        style={{ background: `${G.red}25`, border: `4px solid ${G.red}` }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill={G.red} stroke={G.red} strokeWidth={1}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-black text-[var(--foreground)]">Out of hearts</h2>
        <p className="text-[var(--muted)] mt-1 text-sm">
          Refill to keep going or come back later.
        </p>
      </div>

      <button onClick={onRefill} disabled={!canRefill}
        className="w-full py-4 rounded-2xl font-black text-lg text-white transition-all"
        style={{
          background: canRefill ? 'var(--accent)' : 'var(--card-border)',
          boxShadow: canRefill ? '0 4px 0 var(--accent-hover)' : 'none',
          cursor: canRefill ? 'pointer' : 'not-allowed',
          color: canRefill ? 'white' : 'var(--muted)',
        }}>
        Refill {MAX_HEARTS} hearts — {HEART_REFILL_COST} credits
      </button>
      {!canRefill && (
        <p className="text-xs font-semibold" style={{ color: G.red }}>
          You only have {credits} credits.
        </p>
      )}

      <div className="w-full text-center text-sm text-[var(--muted)]">
        Or wait {minLeft > 0 ? `~${minLeft} min` : 'a bit'} for a free heart.
      </div>

      <button onClick={onQuit}
        className="w-full py-3 rounded-2xl font-bold text-base border-2 transition-colors"
        style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}>
        Quit lesson
      </button>
    </motion.div>
  )
}

// ─── checkpoint failed ─────────────────────────────────────────────────────────
function CheckpointFailedScreen({
  correctCount, total, passThreshold, hearts, onRetry, onQuit,
}: {
  correctCount: number; total: number; passThreshold: number
  hearts: number; onRetry: () => void; onQuit: () => void
}) {
  const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0
  const needed = Math.ceil(passThreshold * total)
  const canRetry = hearts >= 1
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-5 py-2">
      <div className="w-24 h-24 rounded-full flex items-center justify-center"
        style={{ background: `${G.yellow}30`, border: `4px solid ${G.yellow}` }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={G.yellow} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-black text-[var(--foreground)]">Not quite!</h2>
        <p className="text-[var(--muted)] mt-1 text-sm">
          You got <span className="font-bold" style={{ color: G.redDark }}>{correctCount}/{total}</span> ({pct}%).
          You need at least {needed}/{total} to pass.
        </p>
      </div>
      <button onClick={onRetry} disabled={!canRetry}
        className="w-full py-4 rounded-2xl font-black text-lg text-white transition-all"
        style={{
          background: canRetry ? 'var(--accent)' : 'var(--card-border)',
          boxShadow: canRetry ? '0 4px 0 var(--accent-hover)' : 'none',
          cursor: canRetry ? 'pointer' : 'not-allowed',
          color: canRetry ? 'white' : 'var(--muted)',
        }}>
        Try again — costs 1 heart
      </button>
      {!canRetry && (
        <p className="text-xs font-semibold" style={{ color: G.red }}>
          You need at least 1 heart to retry.
        </p>
      )}
      <button onClick={onQuit}
        className="w-full py-3 rounded-2xl font-bold text-base border-2 transition-colors"
        style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}>
        Quit checkpoint
      </button>
    </motion.div>
  )
}

// ─── main modal ────────────────────────────────────────────────────────────────
interface Props {
  lesson: Lesson
  langCode: string
  newAchievements?: Achievement[]
  audioOnly?: boolean
  /** Custom exercise pool (used by Review Weak Words and Daily Challenge). Defaults to lesson.exercises. */
  exercisePool?: Exercise[]
  /** Mistake tracking key — if set, correctAnswer of wrong answers is logged to `cardlet-lang-mistakes[trackMistakesFor]`. */
  trackMistakesFor?: string
  /** 'lesson' (default) scores by hearts lost; 'checkpoint' scores by correct-answer rate. */
  mode?: 'lesson' | 'checkpoint'
  /** Override the per-session question count. Default 5 for lessons, 10 for checkpoints. */
  sessionSize?: number
  /** Fraction of correct answers needed to pass a checkpoint (0–1). Default 0.8. */
  passThreshold?: number
  /** Unit id whose checkpoint is marked passed on success. Required for checkpoint mode. */
  checkpointUnitId?: string
  onComplete: (xpEarned: number, perfect: boolean) => void
  onClose: () => void
}

const DEFAULT_SESSION = 5
const DEFAULT_CHECKPOINT_SESSION = 10

function shuffleAndPick<T>(pool: T[], count: number): T[] {
  const arr = [...pool]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, count)
}

function hasAudio(ex: Exercise): boolean {
  if (ex.type === 'matchPairs') return false
  if (ex.type === 'translate') return ex.promptLang === 'target'
  // multipleChoice: target-lang audio works when the question begins with a quoted target word
  return /^\s*["'"'«「]/.test(ex.question)
}

// pairFromExercise lives in vocab.ts — imported above. Kept DRY so the export
// feature sees identical parsing semantics as the mistake tracker.

export function LessonModal({
  lesson, langCode, newAchievements = [], audioOnly = false,
  exercisePool, trackMistakesFor,
  mode = 'lesson', sessionSize, passThreshold = 0.8, checkpointUnitId,
  onComplete, onClose,
}: Props) {
  const credits = useCredits()
  const isCheckpoint = mode === 'checkpoint'
  const [exerciseIdx, setExerciseIdx] = useState(0)
  const [hearts, setHearts] = useState<number>(() => getCurrentHearts().hearts)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [phase, setPhase] = useState<'lesson' | 'complete' | 'failed' | 'checkpoint-failed'>(
    () => (getCurrentHearts().hearts > 0 ? 'lesson' : 'failed')
  )
  const [feedbackVisible, setFeedbackVisible] = useState(false)
  const [feedbackCorrect, setFeedbackCorrect] = useState(false)
  const [exerciseKey, setExerciseKey] = useState(0)
  const [perfect, setPerfect] = useState(true)
  const [finalXp, setFinalXp] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  const exercises = useMemo(() => {
    const pool = exercisePool ?? lesson.exercises
    const filtered = audioOnly ? pool.filter(hasAudio) : pool
    const usable = filtered.length > 0 ? filtered : pool
    const size = sessionSize ?? (isCheckpoint ? DEFAULT_CHECKPOINT_SESSION : DEFAULT_SESSION)
    return shuffleAndPick(usable, size)
  }, [lesson, audioOnly, exercisePool, isCheckpoint, sessionSize])
  const totalExercises = exercises.length
  const currentExercise = exercises[exerciseIdx]

  function advance(wasCorrect: boolean) {
    if (wasCorrect) setCorrectCount((c) => c + 1)
    if (!wasCorrect) {
      if (!isCheckpoint) {
        const newHearts = loseHeart()
        setHearts(newHearts)
        if (newHearts <= 0) {
          setPhase('failed')
          return
        }
      }
      setPerfect(false)
      if (trackMistakesFor) {
        const pair = pairFromExercise(currentExercise)
        if (pair) logMistake(trackMistakesFor, pair.target, pair.english)
      }
    } else if (trackMistakesFor && currentExercise.type !== 'matchPairs') {
      // Review mode: a correct answer decrements the mistake count
      const pair = pairFromExercise(currentExercise)
      if (pair) clearMistake(trackMistakesFor, pair.target)
    }
    setFeedbackCorrect(wasCorrect)
    setFeedbackVisible(true)
  }

  function finalizeXp() {
    if (isCheckpoint) {
      // Include the match-pair advance that bypasses `advance(...)` — matchPairs count as correct.
      const finalCorrect = correctCount
      const passed = totalExercises > 0 && finalCorrect / totalExercises >= passThreshold
      if (passed) {
        if (checkpointUnitId) markCheckpointPassed(checkpointUnitId)
        const xp = Math.round(lesson.xpReward * (0.7 + (finalCorrect / totalExercises) * 0.3))
        const clampedXp = Math.max(5, xp)
        setFinalXp(clampedXp)
        setShowConfetti(true)
        bumpStreak()
        addDailyXp(clampedXp)
        setPhase('complete')
      } else {
        setFinalXp(0)
        setPhase('checkpoint-failed')
      }
      return
    }
    const xp = Math.round(lesson.xpReward * (0.5 + (hearts / 10)) - hintsUsed * 3)
    const clampedXp = Math.max(5, xp)
    setFinalXp(clampedXp)
    if (perfect) setShowConfetti(true)
    bumpStreak()
    addDailyXp(clampedXp)
    setPhase('complete')
  }

  function handleCheckpointRetry() {
    const newHearts = loseHeart()
    setHearts(newHearts)
    if (newHearts <= 0) { setPhase('failed'); return }
    setExerciseIdx(0)
    setExerciseKey((k) => k + 1)
    setCorrectCount(0)
    setPerfect(true)
    setFeedbackVisible(false)
    setPhase('lesson')
  }

  const handleContinue = useCallback(() => {
    setFeedbackVisible(false)
    if (exerciseIdx + 1 >= totalExercises) {
      finalizeXp()
    } else {
      setExerciseIdx((i) => i + 1)
      setExerciseKey((k) => k + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseIdx, totalExercises, hearts, hintsUsed, perfect, lesson.xpReward])

  function handleMatchComplete() {
    setCorrectCount((c) => c + 1)
    if (exerciseIdx + 1 >= totalExercises) {
      finalizeXp()
    } else {
      setExerciseIdx((i) => i + 1)
      setExerciseKey((k) => k + 1)
    }
  }

  function handleRefill() {
    if (!credits.consumeCredits(HEART_REFILL_COST)) return
    refillAllHearts()
    setHearts(MAX_HEARTS)
    setPhase('lesson')
  }

  // Global keyboard: Space/Enter for feedback continue and completion continue
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      if (phase === 'complete') { onComplete(finalXp, perfect); return }
      if (feedbackVisible) { handleContinue(); return }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [phase, feedbackVisible, finalXp, perfect, handleContinue, onComplete])

  return (
    <>
      {showConfetti && <Confetti />}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>

        <motion.div
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
          style={{ background: 'var(--surface)', maxHeight: '95dvh' }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[var(--card-border)] shrink-0">
            <button onClick={onClose}
              className="rounded-full p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {phase === 'lesson' && (
              <div className="flex-1">
                <ProgressBar current={exerciseIdx} total={totalExercises} />
              </div>
            )}
            {phase !== 'lesson' && <div className="flex-1" />}
            <div className="flex items-center gap-0.5 shrink-0">
              {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                <Heart key={i} filled={i < hearts} />
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <AnimatePresence mode="wait">
              {phase === 'complete' ? (
                <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <CompletionScreen
                    xpEarned={finalXp} heartsLeft={hearts}
                    hintsUsed={hintsUsed} perfect={perfect}
                    newAchievements={newAchievements}
                    onContinue={() => onComplete(finalXp, perfect)}
                  />
                </motion.div>
              ) : phase === 'failed' ? (
                <OutOfHeartsScreen
                  credits={credits.credits}
                  onRefill={handleRefill}
                  onQuit={onClose}
                />
              ) : phase === 'checkpoint-failed' ? (
                <CheckpointFailedScreen
                  correctCount={correctCount}
                  total={totalExercises}
                  passThreshold={passThreshold}
                  hearts={hearts}
                  onRetry={handleCheckpointRetry}
                  onQuit={onClose}
                />
              ) : (
                <motion.div key={exerciseKey}
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                  {currentExercise.type === 'multipleChoice' && (
                    <MultipleChoice exercise={currentExercise} langCode={langCode}
                      feedbackVisible={feedbackVisible}
                      onAnswer={(idx) => advance(idx === currentExercise.correctIndex)} />
                  )}
                  {currentExercise.type === 'translate' && (
                    <TranslateExercise exercise={currentExercise} langCode={langCode}
                      feedbackVisible={feedbackVisible}
                      onAnswer={(correct) => advance(correct)}
                      onHintUsed={() => setHintsUsed((h) => h + 1)} />
                  )}
                  {currentExercise.type === 'matchPairs' && (
                    <MatchPairsExercise exercise={currentExercise} onAnswer={handleMatchComplete} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Feedback bar */}
          <AnimatePresence>
            {feedbackVisible && (
              <motion.div
                initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="shrink-0 px-5 py-4 border-t-2"
                style={{ background: feedbackCorrect ? G.greenBg : G.redBg, borderColor: feedbackCorrect ? G.green : G.red }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: feedbackCorrect ? G.green : G.red }}>
                      {feedbackCorrect
                        ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                        : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      }
                    </div>
                    <div>
                      <p className="font-black text-base"
                        style={{ color: feedbackCorrect ? G.greenDark : G.redDark }}>
                        {feedbackCorrect ? 'Correct!' : 'Not quite!'}
                      </p>
                      <p className="text-sm opacity-80"
                        style={{ color: feedbackCorrect ? G.greenDark : G.redDark }}>
                        {feedbackCorrect ? 'Great work!' : 'Try to remember it.'}
                      </p>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleContinue}
                    className="px-6 py-3 rounded-2xl font-black text-white text-base"
                    style={{ background: feedbackCorrect ? G.green : G.red, boxShadow: `0 4px 0 ${feedbackCorrect ? G.greenDark : G.redDark}` }}>
                    Continue <span className="text-sm opacity-60 font-normal">↵</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </>
  )
}
