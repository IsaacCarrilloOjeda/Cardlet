'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  useCredits,
  TUTOR_FULL_COST,
  TUTOR_HALF_COST,
  WRITTEN_GRADING_COST,
  CARD_GEN_COST,
  IMAGE_OCR_COST,
} from './CreditsContext'

const R = 30
const CX = 40
const CY = 40
const CIRCUMFERENCE = 2 * Math.PI * R

interface Props {
  variant?: 'floating' | 'header'
}

export function CircleProgress({ variant = 'floating' }: Props) {
  const { credits, totalCredits } = useCredits()
  const [expanded, setExpanded] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminChecked, setAdminChecked] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const used = totalCredits - credits
  const fraction = totalCredits > 0 ? Math.min(used / totalCredits, 1) : 0

  const snakeLength = CIRCUMFERENCE * fraction
  void snakeLength

  function snakeColor() {
    if (fraction < 0.6) return 'var(--accent)'
    if (fraction < 0.85) return '#f59e0b'
    return '#ef4444'
  }

  // Check admin role
  useEffect(() => {
    async function checkAdmin() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setAdminChecked(true); return }
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role === 'admin') setIsAdmin(true)
      } catch {}
      setAdminChecked(true)
    }
    checkAdmin()
  }, [])

  // Click-outside to close tooltip
  useEffect(() => {
    if (!expanded) return
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setExpanded(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [expanded])

  if (!adminChecked || isAdmin) return null

  if (variant === 'header') {
    return <CompactCircle credits={credits} totalCredits={totalCredits} fraction={fraction} />
  }

  return (
    <div className="fixed left-4 z-40 hidden lg:block" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}>
      <div ref={wrapperRef} className="relative flex flex-col items-center gap-2">
        {expanded && (
          <div className="absolute bottom-[88px] left-0 w-56 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-3 shadow-xl text-xs flex flex-col gap-2">
            <p className="font-semibold text-sm">AI Credits</p>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Remaining</span>
              <span className="font-medium">{credits}/{totalCredits}</span>
            </div>
            <div className="border-t border-[var(--card-border)] pt-2 flex flex-col gap-1 text-[10px] text-[var(--muted)]">
              <span>Tutor (full) — {TUTOR_FULL_COST} credits</span>
              <span>Tutor (half) — {TUTOR_HALF_COST} credits</span>
              <span>Written grading — {WRITTEN_GRADING_COST} credit</span>
              <span>Card gen — {CARD_GEN_COST} credit/card</span>
              <span>Photo OCR — {IMAGE_OCR_COST} credits</span>
            </div>
            <Link
              href="/credits"
              onClick={() => setExpanded(false)}
              className="mt-1 w-full rounded-lg bg-[var(--accent)] py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors text-center"
            >
              Get More Credits
            </Link>
          </div>
        )}

        <button
          onClick={() => setExpanded((v) => !v)}
          title="AI credits remaining"
          className="relative flex items-center justify-center rounded-full bg-[var(--card)] border border-[var(--card-border)] shadow-lg hover:border-[var(--accent)] transition-colors"
          style={{ width: 72, height: 72 }}
        >
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ position: 'absolute', top: -4, left: -4 }}>
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--card-border)" strokeWidth="5" />
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={snakeColor()}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE * fraction} ${CIRCUMFERENCE}`}
              strokeDashoffset={CIRCUMFERENCE * 0.25}
              style={{ transform: 'rotate(-90deg)', transformOrigin: `${CX}px ${CY}px`, transition: 'stroke-dasharray 0.6s ease' }}
            />
          </svg>
          <div className="flex flex-col items-center leading-none z-10">
            <span className="text-xs font-bold tabular-nums" style={{ color: snakeColor() }}>{credits}</span>
            <span className="text-[9px] text-[var(--muted)]">credits</span>
          </div>
          <Link
            href="/credits"
            title="Get more credits"
            onClick={(e) => e.stopPropagation()}
            className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center hover:scale-110 transition-transform shadow-md"
          >
            +
          </Link>
        </button>
      </div>
    </div>
  )
}

// ── Compact header variant for mobile ─────────────────────────────────────
function CompactCircle({
  credits,
  totalCredits,
  fraction,
}: {
  credits: number
  totalCredits: number
  fraction: number
}) {
  const [expanded, setExpanded] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  function snakeColor() {
    if (fraction < 0.6) return 'var(--accent)'
    if (fraction < 0.85) return '#f59e0b'
    return '#ef4444'
  }

  useEffect(() => {
    if (!expanded) return
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setExpanded(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [expanded])

  const SIZE = 32
  const STROKE = 3.5
  const r = (SIZE - STROKE) / 2
  const c = 2 * Math.PI * r

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setExpanded((v) => !v)}
        title={`${credits} credits remaining`}
        className="relative flex items-center justify-center rounded-full hover:bg-[var(--surface)] transition-colors"
        style={{ width: SIZE + 4, height: SIZE + 4 }}
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" stroke="var(--card-border)" strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={r}
            fill="none"
            stroke={snakeColor()}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${c * fraction} ${c}`}
            strokeDashoffset={c * 0.25}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${SIZE / 2}px ${SIZE / 2}px`, transition: 'stroke-dasharray 0.4s ease' }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums"
          style={{ color: snakeColor() }}
        >
          {credits}
        </span>
      </button>

      {expanded && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-3 shadow-xl text-xs flex flex-col gap-2 z-50">
          <p className="font-semibold text-sm">AI Credits</p>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Remaining</span>
            <span className="font-medium">{credits}/{totalCredits}</span>
          </div>
          <div className="border-t border-[var(--card-border)] pt-2 flex flex-col gap-1 text-[10px] text-[var(--muted)]">
            <span>Tutor (full) — {TUTOR_FULL_COST} credits</span>
            <span>Tutor (half) — {TUTOR_HALF_COST} credits</span>
            <span>Written grading — {WRITTEN_GRADING_COST} credit</span>
            <span>Card gen — {CARD_GEN_COST} credit/card</span>
            <span>Photo OCR — {IMAGE_OCR_COST} credits</span>
          </div>
          <Link
            href="/credits"
            onClick={() => setExpanded(false)}
            className="mt-1 w-full rounded-lg bg-[var(--accent)] py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors text-center"
          >
            Get More Credits
          </Link>
        </div>
      )}
    </div>
  )
}
