'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const WORK_SECS = 25 * 60
const BREAK_SECS = 5 * 60

function beep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)
  } catch {
    // AudioContext unavailable — silent fallback
  }
}

function fmt(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function PomodoroTimer() {
  const [open, setOpen] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [secs, setSecs] = useState(WORK_SECS)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const reset = useCallback((toBreak = false) => {
    setSecs(toBreak ? BREAK_SECS : WORK_SECS)
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecs((prev) => {
        if (prev <= 1) {
          beep()
          if (!isBreak) {
            setSessions((s) => s + 1)
            setIsBreak(true)
            setSecs(BREAK_SECS)
          } else {
            setIsBreak(false)
            setSecs(WORK_SECS)
          }
          return isBreak ? WORK_SECS : BREAK_SECS
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, isBreak])

  const pct = secs / (isBreak ? BREAK_SECS : WORK_SECS)
  const r = 22
  const circ = 2 * Math.PI * r
  const dash = circ * pct

  return (
    <div className="flex items-center justify-center">
      {open ? (
        <div
          className="flex items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-2.5 shadow-lg"
          style={{ minWidth: 260 }}
        >
          {/* Ring */}
          <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0 -rotate-90">
            <circle cx="26" cy="26" r={r} stroke="var(--card-border)" strokeWidth="3.5" fill="none" />
            <circle
              cx="26" cy="26" r={r}
              stroke={isBreak ? '#10b981' : 'var(--accent)'}
              strokeWidth="3.5"
              fill="none"
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.4s linear' }}
            />
          </svg>

          <div className="flex flex-col gap-0.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: isBreak ? '#10b981' : 'var(--accent)' }}>
                {isBreak ? 'Break' : 'Focus'}
              </span>
              <span className="text-[10px] text-[var(--muted)]">{sessions} session{sessions !== 1 ? 's' : ''}</span>
            </div>
            <span className="text-2xl font-bold tabular-nums leading-none">{fmt(secs)}</span>

            <div className="flex items-center gap-1.5 mt-1">
              <button
                onClick={() => setRunning((r) => !r)}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
                style={{
                  background: running ? 'var(--surface-raised)' : 'var(--accent)',
                  color: running ? 'var(--foreground)' : '#fff',
                  border: running ? '1px solid var(--card-border)' : 'none',
                }}
              >
                {running ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={() => reset(isBreak)}
                className="rounded-full border border-[var(--card-border)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  const next = !isBreak
                  setIsBreak(next)
                  reset(next)
                }}
                className="rounded-full border border-[var(--card-border)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors ml-auto"
              >
                {isBreak ? '→ Focus' : '→ Break'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Collapse timer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-[var(--card-border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          title="Pomodoro timer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          {running ? fmt(secs) : 'Timer'}
          {running && (
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: isBreak ? '#10b981' : 'var(--accent)' }}
            />
          )}
        </button>
      )}
    </div>
  )
}
