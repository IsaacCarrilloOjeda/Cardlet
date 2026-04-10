'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminLoginAction } from '@/lib/actions'

export function AdminLoginClient() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)
    try {
      const result = await adminLoginAction(password)
      if (result.success) {
        router.push('/admin/overview')
      } else {
        setError(true)
        setPassword('')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-3xl mb-2">🔐</p>
          <h1 className="text-2xl font-bold">Admin Access</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Cardlet control panel</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 flex flex-col gap-4 shadow-xl"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted)]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
              className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-3 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center">Incorrect password. Try again.</p>
          )}

          <button
            type="submit"
            disabled={!password || loading}
            className="w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors"
          >
            {loading ? 'Verifying…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
