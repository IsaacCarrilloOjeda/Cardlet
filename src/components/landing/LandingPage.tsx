'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

// ── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="py-24 px-4 text-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[var(--accent)]/10 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 px-4 py-1.5 text-xs font-semibold text-[var(--accent)] mb-6">
          <span>✨</span> AI-powered studying
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-[var(--foreground)] leading-[1.05] mb-6">
          The faster way<br />
          <span style={{ color: 'var(--accent)' }}>to learn anything</span>
        </h1>

        <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto mb-10">
          Create flashcard sets in seconds with AI. Study smarter with spaced repetition, practice tests, and an AI tutor that explains everything.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/login"
            className="rounded-full px-8 py-4 text-base font-black hover:opacity-90 transition-opacity"
            style={{ background: 'var(--cta)', color: 'var(--cta-text)' }}
          >
            Get started — it&apos;s free
          </Link>
          <Link
            href="/explore"
            className="rounded-full px-8 py-4 text-base font-medium border border-[var(--card-border)] text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
          >
            Browse sets
          </Link>
        </div>

        {/* Card stack visual */}
        <div className="relative h-48 flex items-center justify-center">
          <div className="absolute w-72 h-40 rounded-2xl bg-[var(--surface)] border border-[var(--card-border)] shadow-2xl -rotate-6 opacity-60" />
          <div className="absolute w-72 h-40 rounded-2xl bg-[var(--surface)] border border-[var(--card-border)] shadow-2xl rotate-3 opacity-80" />
          <motion.div
            whileHover={{ rotateY: 10, rotateX: -5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative w-72 h-40 rounded-2xl bg-[var(--surface-raised)] border border-[var(--accent)]/40 shadow-2xl flex flex-col justify-center px-6"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1">TERM</p>
            <p className="text-[var(--foreground)] font-bold text-lg">Photosynthesis</p>
            <div className="mt-3 h-px bg-[var(--card-border)]" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mt-3 mb-1">DEFINITION</p>
            <p className="text-[var(--muted)] text-sm">Process by which plants convert sunlight into food</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ── Feature: AI Generation ───────────────────────────────────────────────────
function AIGenerationSection() {
  return (
    <section className="py-20 px-4 bg-[var(--surface)]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-[var(--teal)] text-sm font-bold uppercase tracking-widest mb-3">AI-Powered</p>
          <h2 className="text-4xl font-black text-[var(--foreground)] mb-5 leading-tight">
            Turn any content into<br />flashcards instantly
          </h2>
          <p className="text-[var(--muted)] text-lg mb-6">
            Paste notes, describe a topic, or upload a document. Cardlet&apos;s AI generates complete, ready-to-study flashcard sets in seconds.
          </p>
          <ul className="flex flex-col gap-3 mb-8">
            {['Generate from notes or any topic', 'PDF and document import', 'Edit and customize every card', 'AI tutor to explain hard concepts'].map((item) => (
              <li key={item} className="flex items-center gap-3 text-[var(--foreground)] text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)] font-bold text-xs shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/login"
            className="inline-flex rounded-full px-6 py-3 text-sm font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            Try it free
          </Link>
        </div>

        {/* Mock UI */}
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--background)] p-5 shadow-2xl">
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3 mb-4">
            <p className="text-xs text-[var(--muted)] mb-1.5">Generate flashcards from…</p>
            <p className="text-sm text-[var(--foreground)] font-medium">Biology Chapter 12: Cell Division</p>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-[var(--card-border)]" />
            <span className="text-xs text-[var(--accent)] font-semibold">10 cards generated ✨</span>
            <div className="h-px flex-1 bg-[var(--card-border)]" />
          </div>
          {[
            { term: 'Mitosis', def: 'Cell division producing two identical daughter cells' },
            { term: 'Meiosis', def: 'Division producing 4 genetically unique haploid cells' },
            { term: 'Telophase', def: 'Final stage where nuclear envelopes re-form' },
          ].map((card, i) => (
            <div key={i} className="rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3 mb-2 last:mb-0">
              <p className="text-[10px] text-[var(--accent)] font-bold uppercase mb-0.5">Term</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{card.term}</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">{card.def}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Feature: Study Modes ─────────────────────────────────────────────────────
function StudyModesSection() {
  const modes = [
    { icon: '🃏', name: 'Flashcards', desc: 'Classic flip-card review', active: true },
    { icon: '✅', name: 'Multiple Choice', desc: 'AI-generated answer choices' },
    { icon: '✏️', name: 'Written', desc: 'Type your answer, AI grades it' },
    { icon: '🔀', name: 'Match', desc: 'Drag-and-drop pairing game' },
  ]

  return (
    <section className="py-20 px-4 bg-[var(--background)]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Mode cards */}
        <div className="grid grid-cols-2 gap-3 order-2 lg:order-1">
          {modes.map((mode) => (
            <div
              key={mode.name}
              className={`rounded-2xl border p-4 transition-colors ${
                mode.active
                  ? 'bg-[var(--accent)]/15 border-[var(--accent)]/40'
                  : 'bg-[var(--surface)] border-[var(--card-border)] hover:border-[var(--accent)]/30'
              }`}
            >
              <p className="text-2xl mb-2">{mode.icon}</p>
              <p className="font-bold text-sm text-[var(--foreground)] mb-1">{mode.name}</p>
              <p className="text-xs text-[var(--muted)]">{mode.desc}</p>
            </div>
          ))}
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--cta)' }}>Multiple Study Modes</p>
          <h2 className="text-4xl font-black text-[var(--foreground)] mb-5 leading-tight">
            Study the way<br />that works for you
          </h2>
          <p className="text-[var(--muted)] text-lg mb-6">
            From classic flashcard flipping to written tests with AI grading, Cardlet gives you every tool to master your material.
          </p>
          <Link
            href="/login"
            className="inline-flex rounded-full px-6 py-3 text-sm font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            Start studying
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Stats bar ────────────────────────────────────────────────────────────────
function StatsSection() {
  const stats = [
    { value: '2M+', label: 'Cards created' },
    { value: '100K+', label: 'Study sets' },
    { value: '4.9★', label: 'Average rating' },
  ]

  return (
    <section className="py-16 px-4" style={{ background: 'var(--accent)' }}>
      <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.value}>
            <p className="text-4xl md:text-5xl font-black text-white">{s.value}</p>
            <p className="text-white/70 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Pricing ──────────────────────────────────────────────────────────────────
function PricingSection() {
  const [annual, setAnnual] = useState(false)

  const plans = [
    {
      name: 'Free',
      price: { monthly: '$0', annual: '$0' },
      sub: 'Forever free',
      cta: 'Get started',
      ctaHref: '/login',
      highlight: false,
      features: ['100 AI credits / month', 'Up to 20 study sets', 'Flashcard study mode', 'Community sets', 'Basic leaderboard'],
    },
    {
      name: 'Pro',
      price: { monthly: '$8', annual: '$5' },
      sub: annual ? 'Billed annually' : 'Per month',
      cta: 'Start free trial',
      ctaHref: '/login',
      highlight: true,
      badge: 'Most popular',
      features: ['Unlimited AI credits', 'Unlimited study sets', 'All study modes', 'PDF import', 'AI tutor chat', 'Priority support', 'Advanced analytics'],
    },
  ]

  return (
    <section id="pricing" className="py-20 px-4 bg-[var(--surface)]">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-black text-[var(--foreground)] text-center mb-3">Simple pricing</h2>
        <p className="text-[var(--muted)] text-center mb-8">No hidden fees. Cancel anytime.</p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setAnnual(false)}
            className={`text-sm font-semibold transition-colors ${!annual ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative h-6 w-12 rounded-full transition-colors ${annual ? 'bg-[var(--accent)]' : 'bg-[var(--card-border)]'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${annual ? 'translate-x-6' : ''}`} />
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`text-sm font-semibold transition-colors ${annual ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`}
          >
            Annual{' '}
            <span className="text-[var(--success)] font-bold">save 37%</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 relative ${
                plan.highlight
                  ? 'bg-[var(--accent)] border-transparent'
                  : 'bg-[var(--background)] border-[var(--card-border)]'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: 'var(--cta)', color: 'var(--cta-text)' }}
                >
                  {plan.badge}
                </span>
              )}
              <p className={`font-bold text-xl mb-1 ${plan.highlight ? 'text-white' : 'text-[var(--foreground)]'}`}>
                {plan.name}
              </p>
              <p className={`text-5xl font-black mb-0.5 ${plan.highlight ? 'text-white' : 'text-[var(--foreground)]'}`}>
                {annual ? plan.price.annual : plan.price.monthly}
                <span className={`text-base font-medium ml-1 ${plan.highlight ? 'text-white/70' : 'text-[var(--muted)]'}`}>/ mo</span>
              </p>
              <p className={`text-xs mb-6 ${plan.highlight ? 'text-white/60' : 'text-[var(--muted)]'}`}>{plan.sub}</p>

              <Link
                href={plan.ctaHref}
                className={`w-full block text-center rounded-full py-3 text-sm font-bold mb-6 hover:opacity-90 transition-opacity ${
                  plan.highlight
                    ? ''
                    : 'bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--card-border)]'
                }`}
                style={plan.highlight ? { background: 'var(--cta)', color: 'var(--cta-text)' } : {}}
              >
                {plan.cta}
              </Link>

              <ul className="flex flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-white/90' : 'text-[var(--foreground)]'}`}>
                    <span className={`text-xs ${plan.highlight ? 'text-white' : 'text-[var(--accent)]'}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── FAQ ──────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: 'Is Cardlet really free?', a: 'Yes! Cardlet has a generous free tier with 100 AI credits per month and up to 20 study sets. No credit card required.' },
  { q: 'How does the AI card generation work?', a: 'Just type a topic or paste your notes, and our AI (powered by Claude) generates high-quality flashcards automatically. You can edit any card before saving.' },
  { q: 'Can I import sets from Quizlet?', a: 'You can paste your content from any source and our AI will structure it into flashcards. Direct Quizlet import is on our roadmap.' },
  { q: "What's the difference between Free and Pro?", a: 'Pro unlocks unlimited AI credits, unlimited sets, all study modes (written, match, practice tests), PDF import, and the AI tutor chat.' },
  { q: 'Is my data secure?', a: 'All data is stored securely with Supabase (Postgres) and protected by row-level security. We never sell your data.' },
]

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-20 px-4 bg-[var(--background)]">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-black text-[var(--foreground)] text-center mb-10">Frequently asked questions</h2>
        <div className="flex flex-col divide-y divide-[var(--card-border)]">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="py-4">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 text-left"
              >
                <span className="font-semibold text-[var(--foreground)] text-sm">{item.q}</span>
                <motion.span
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[var(--muted)] shrink-0"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[var(--muted)] text-sm mt-3 overflow-hidden"
                  >
                    {item.a}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CTA Banner ───────────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section className="py-20 px-4 text-center" style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)' }}>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-5xl font-black text-white mb-4 leading-tight">
          Start studying smarter today
        </h2>
        <p className="text-white/70 text-lg mb-8">
          Join thousands of students already using Cardlet to ace their exams.
        </p>
        <Link
          href="/login"
          className="inline-flex rounded-full px-10 py-4 text-lg font-black hover:opacity-90 transition-opacity"
          style={{ background: 'var(--cta)', color: 'var(--cta-text)' }}
        >
          Create free account
        </Link>
      </div>
    </section>
  )
}

// ── Full Landing Page ────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <>
      <HeroSection />
      <AIGenerationSection />
      <StudyModesSection />
      <StatsSection />
      <PricingSection />
      <FAQSection />
      <CTABanner />
    </>
  )
}
