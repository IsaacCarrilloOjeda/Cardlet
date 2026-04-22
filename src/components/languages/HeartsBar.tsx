'use client'

import { useEffect, useState } from 'react'
import { MAX_HEARTS, getCurrentHearts, subscribeLangStorage } from './storage'

function HeartSvg({ filled, size = 18 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? 'var(--accent)' : 'none'}
      stroke={filled ? 'var(--accent)' : 'var(--muted)'}
      strokeWidth={2}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function formatMs(ms: number): string {
  if (ms <= 0) return ''
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
}

export function HeartsBar({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<{ hearts: number; msToNext: number }>({ hearts: MAX_HEARTS, msToNext: 0 })

  useEffect(() => {
    const refresh = () => setState(getCurrentHearts())
    refresh()
    const unsub = subscribeLangStorage(refresh)
    const tick = setInterval(refresh, 1000)
    return () => { unsub(); clearInterval(tick) }
  }, [])

  const showTimer = !compact && state.hearts < MAX_HEARTS && state.msToNext > 0

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
      style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: MAX_HEARTS }).map((_, i) => (
          <HeartSvg key={i} filled={i < state.hearts} size={compact ? 14 : 16} />
        ))}
      </div>
      {showTimer && (
        <span className="text-[11px] font-semibold text-[var(--muted)] ml-1 tabular-nums">
          +1 in {formatMs(state.msToNext)}
        </span>
      )}
    </div>
  )
}
