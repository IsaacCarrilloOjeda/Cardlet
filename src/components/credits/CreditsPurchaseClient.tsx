'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCredits } from '@/components/layout/CreditsContext'

const PRESETS = [
  { amount: 100, label: '100 Credits', price: '$1.99', popular: false },
  { amount: 250, label: '250 Credits', price: '$3.99', popular: true },
  { amount: 500, label: '500 Credits', price: '$6.99', popular: false },
  { amount: 1000, label: '1,000 Credits', price: '$11.99', popular: false },
]

const UNLIMITED_AMOUNT = 999_999

export function CreditsPurchaseClient() {
  const { credits, totalCredits, addCredits } = useCredits()
  const router = useRouter()
  const [customAmount, setCustomAmount] = useState('')
  const [justAdded, setJustAdded] = useState<number | null>(null)

  function handleAdd(amount: number) {
    addCredits(amount)
    setJustAdded(amount)
    setTimeout(() => {
      setJustAdded(null)
      router.push('/')
    }, 1200)
  }

  function handleCustom() {
    const n = parseInt(customAmount, 10)
    if (!n || n < 1 || n > 100_000) return
    handleAdd(n)
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-16 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">AI Credits</h1>
          <p className="text-[var(--muted)] text-sm">
            Your credits reset to 100 on the 1st of every month.
            <br />
            Buy more anytime — they stack with your monthly allotment.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--surface)] px-4 py-2 text-sm">
            <span className="text-[var(--muted)]">Current balance:</span>
            <span className="font-bold text-[var(--accent)]">{credits}</span>
            <span className="text-[var(--muted)]">/ {totalCredits} credits</span>
          </div>
        </div>

        {/* Preset cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {PRESETS.map(({ amount, label, price, popular }) => (
            <button
              key={amount}
              onClick={() => handleAdd(amount)}
              disabled={justAdded !== null}
              className={`relative rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 ${
                popular
                  ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                  : 'border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--accent)]'
              }`}
            >
              {popular && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                  Popular
                </span>
              )}
              <p className="text-lg font-bold">{label}</p>
              <p className="text-sm text-[var(--muted)] mt-0.5">{price}</p>
              {justAdded === amount && (
                <p className="text-xs font-semibold text-green-400 mt-1">Added!</p>
              )}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 mb-4">
          <p className="text-sm font-semibold mb-3">Custom Amount</p>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={100000}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter amount (1–100,000)"
              className="flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
            />
            <button
              onClick={handleCustom}
              disabled={!customAmount || justAdded !== null}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Unlimited card (testing) */}
        <div className="rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--surface)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Unlimited Credits</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Sets your balance to 999,999 credits.
              </p>
              <span className="mt-2 inline-block rounded-full border border-orange-400/40 bg-orange-400/10 px-2 py-0.5 text-[10px] font-semibold text-orange-400 uppercase tracking-wide">
                Testing mode
              </span>
            </div>
            <button
              onClick={() => {
                // Set to unlimited by adding the difference
                addCredits(UNLIMITED_AMOUNT - credits)
                setJustAdded(UNLIMITED_AMOUNT)
                setTimeout(() => {
                  setJustAdded(null)
                  router.push('/')
                }, 1200)
              }}
              disabled={justAdded !== null}
              className="shrink-0 rounded-xl border border-[var(--card-border)] px-4 py-2 text-sm font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
            >
              {justAdded === UNLIMITED_AMOUNT ? 'Added!' : 'Unlock'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--muted)] mt-8">
          Payments are for testing only — no real charges are made.
        </p>
      </div>
    </div>
  )
}
