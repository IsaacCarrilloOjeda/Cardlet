'use client'

import { useCredits } from '@/components/layout/CreditsContext'

export function CreditsPurchaseClient() {
  const { credits, totalCredits } = useCredits()

  return (
    <div className="min-h-screen bg-[var(--background)] py-16 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">AI Credits</h1>
          <p className="text-[var(--muted)] text-sm">
            Each user receives 500 credits on the 1st of every month.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--surface)] px-4 py-2 text-sm">
            <span className="text-[var(--muted)]">Current balance:</span>
            <span className="font-bold text-[var(--accent)]">{credits}</span>
            <span className="text-[var(--muted)]">/ {totalCredits} credits</span>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="rounded-2xl border border-[var(--accent)] bg-[var(--accent)]/5 p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Premium Plans Coming Soon</h2>
          <p className="text-[var(--muted)] mb-6">
            We're working on additional credit packages and subscription options to enhance your learning experience.
          </p>
          <div className="inline-block rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">
            Stay Tuned!
          </div>
        </div>

        <p className="text-center text-xs text-[var(--muted)] mt-8">
          For inquiries about enterprise plans or bulk credits, please contact our support team.
        </p>
      </div>
    </div>
  )
}