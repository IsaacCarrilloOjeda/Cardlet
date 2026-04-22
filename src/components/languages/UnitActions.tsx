'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Unit } from './lessonData'
import { extractUnitVocab } from './vocab'
import { exportLanguageUnitAction } from '@/lib/actions'

interface Props { langId: string; langName: string; unit: Unit }

export function UnitActions({ langId, langName, unit }: Props) {
  const router = useRouter()
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pairs = extractUnitVocab(unit)

  async function onExport() {
    if (pairs.length === 0) {
      setError('No vocab pairs found in this unit.')
      return
    }
    setExporting(true)
    setError(null)
    try {
      const { id } = await exportLanguageUnitAction(langName, unit.title, pairs)
      router.push(`/sets/${id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
      setExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={onExport}
        disabled={exporting}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-60"
        style={{
          background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
          border: '2px solid color-mix(in srgb, var(--accent) 35%, transparent)',
          color: 'var(--accent)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {exporting ? 'Exporting…' : `Export ${pairs.length} flashcards`}
      </button>

      <a
        href={`/languages/${langId}/chat/${unit.id}`}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95"
        style={{
          background: 'var(--surface)',
          border: '2px solid var(--card-border)',
          color: 'var(--foreground)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Practice conversation
      </a>

      {error && <p className="text-xs text-red-500 w-full">{error}</p>}
    </div>
  )
}
