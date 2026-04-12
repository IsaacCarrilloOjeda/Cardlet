import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Plans',
  description: 'Choose the Cardlet plan that fits how you study.',
}

const FREE_FEATURES = [
  '100 AI credits / month (auto-reset on the 1st)',
  'Up to 20 study sets',
  'Flashcard study mode',
  'Spaced repetition (SM-2)',
  'Community / public sets',
  'Basic leaderboard',
  'Daily challenge card',
]

const PRO_FEATURES = [
  'Unlimited AI credits',
  'Unlimited study sets',
  'All study modes (quiz, written, match)',
  'AI tutor chat',
  'AI card generator',
  'PDF & photo import',
  'Advanced analytics',
  'Priority support',
]

function Check() {
  return (
    <svg className="h-4 w-4 shrink-0 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-16 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">Choose your plan</h1>
          <p className="text-[var(--muted)]">
            Cardlet is free to use. Upgrade to Pro when you need more power.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Free */}
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-7 flex flex-col">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-1">Free</p>
              <p className="text-4xl font-bold">$0</p>
              <p className="text-sm text-[var(--muted)] mt-1">forever</p>
            </div>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/"
              className="w-full rounded-xl border border-[var(--card-border)] py-2.5 text-sm font-semibold text-center hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              Current plan
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border-2 border-[var(--accent)] bg-[var(--accent)]/5 p-7 flex flex-col relative">
            <span className="absolute -top-3 left-6 rounded-full bg-[var(--accent)] px-3 py-0.5 text-xs font-bold text-white">
              Coming soon
            </span>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-1">Pro</p>
              <p className="text-4xl font-bold">$8</p>
              <p className="text-sm text-[var(--muted)] mt-1">per month</p>
            </div>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              disabled
              className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-bold text-white opacity-60 cursor-not-allowed"
            >
              Notify me when available
            </button>
          </div>
        </div>

        {/* Credits CTA */}
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6 text-center">
          <p className="font-semibold mb-1">Need more AI credits now?</p>
          <p className="text-sm text-[var(--muted)] mb-4">
            Your 100 monthly credits reset on the 1st. Buy additional credits anytime — they stack with your balance.
          </p>
          <Link
            href="/credits"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: 'var(--cta)', color: 'var(--cta-text)' }}
          >
            Buy Credits
          </Link>
        </div>
      </div>
    </div>
  )
}
