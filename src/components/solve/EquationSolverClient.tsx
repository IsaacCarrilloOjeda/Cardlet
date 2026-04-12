'use client'

import { useState } from 'react'
import { useCredits, EQUATION_SOLVE_COST } from '@/components/layout/CreditsContext'
import { SnapPhotoModal } from '@/components/sets/SnapPhotoModal'

export function EquationSolverClient() {
  const { credits, consumeCredits } = useCredits()
  const [equation, setEquation] = useState('')
  const [steps, setSteps] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snapOpen, setSnapOpen] = useState(false)

  async function solve(payload: { equation?: string; imageBase64?: string }) {
    if (!consumeCredits(EQUATION_SOLVE_COST)) {
      setError(`Need ${EQUATION_SOLVE_COST} credits. You have ${credits}.`)
      return
    }
    setLoading(true)
    setError(null)
    setSteps(null)
    try {
      const res = await fetch('/api/ai/solve-equation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setSteps(data.steps)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!equation.trim()) return
    solve({ equation: equation.trim() })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">🧮 Equation Solver</h1>
      <p className="text-sm text-[var(--muted)] mb-6">
        Type a math problem or snap a photo. AI walks through it step-by-step.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6">
        <textarea
          value={equation}
          onChange={(e) => setEquation(e.target.value)}
          placeholder="e.g., Solve for x: 3x² + 5x - 2 = 0"
          rows={3}
          className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm focus:border-[var(--accent)] focus:outline-none resize-none"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !equation.trim()}
            className="flex-1 rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {loading ? 'Solving…' : `Solve (${EQUATION_SOLVE_COST} credits)`}
          </button>
          <button
            type="button"
            onClick={() => setSnapOpen(true)}
            className="rounded-xl border border-[var(--card-border)] px-4 py-3 text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            📸 Snap
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {steps && (
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5">
          <p className="text-xs text-[var(--muted)] mb-3 font-semibold uppercase tracking-wide">Solution</p>
          <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">{steps}</pre>
        </div>
      )}

      <SnapPhotoModal
        open={snapOpen}
        onClose={() => setSnapOpen(false)}
        onTranscribed={(text) => {
          setSnapOpen(false)
          setEquation(text)
          solve({ equation: text })
        }}
        confirmLabel="Solve"
      />
    </div>
  )
}
