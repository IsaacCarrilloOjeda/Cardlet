'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useTheme, ACCENT_COLORS, CTA_COLORS, type AccentKey, type CtaKey } from './ThemeProvider'
import { CircleProgress } from './CircleProgress'
import { MobileNavDrawer } from './MobileNavDrawer'
import { CreateSetModal } from '@/components/dashboard/CreateSetModal'

function CardletIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="24" height="16" rx="3" fill="var(--accent)" opacity="0.3" />
      <rect x="4" y="6" width="24" height="16" rx="3" fill="var(--accent)" opacity="0.6" />
      <rect x="4" y="2" width="24" height="16" rx="3" fill="var(--accent)" />
    </svg>
  )
}

function SettingsDropdown({ onClose }: { onClose: () => void }) {
  const { theme, toggle, accentKey, setAccent, ctaKey, setCta } = useTheme()

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 mt-2 w-64 rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] shadow-2xl py-2 z-50"
    >
      <p className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Appearance</p>
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-[var(--accent)]/10 transition-colors"
      >
        <span className="flex items-center gap-2 text-[var(--foreground)]">
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </span>
      </button>

      <div className="mt-1 border-t border-[var(--card-border)] pt-2 px-3">
        <p className="pb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Accent Color</p>
        <div className="grid grid-cols-5 gap-2 pb-2">
          {(Object.entries(ACCENT_COLORS) as [AccentKey, typeof ACCENT_COLORS[AccentKey]][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => { setAccent(key); onClose() }}
              title={val.label}
              className="flex flex-col items-center gap-1 group"
            >
              <span
                className="w-7 h-7 rounded-full border-2 transition-transform group-hover:scale-110"
                style={{
                  background: val.accent,
                  borderColor: accentKey === key ? val.accent : 'transparent',
                  outline: accentKey === key ? `2px solid ${val.accent}` : '2px solid transparent',
                  outlineOffset: '2px',
                }}
              />
              <span className="text-[8px] text-[var(--muted)]">{val.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--card-border)] pt-2 px-3">
        <p className="pb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Button Color</p>
        <div className="grid grid-cols-6 gap-2 pb-2">
          {(Object.entries(CTA_COLORS) as [CtaKey, typeof CTA_COLORS[CtaKey]][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => { setCta(key); onClose() }}
              title={val.label}
              className="group flex flex-col items-center gap-1"
            >
              <span
                className="w-7 h-7 rounded-full border-2 transition-transform group-hover:scale-110"
                style={{
                  background: val.cta,
                  borderColor: ctaKey === key ? val.cta : 'transparent',
                  outline: ctaKey === key ? `2px solid ${val.cta}` : '2px solid transparent',
                  outlineOffset: '2px',
                }}
              />
              <span className="text-[8px] text-[var(--muted)]">{val.label}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

const SettingsButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="rounded-full p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
    aria-label="Settings"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  </button>
)

function LoggedOutHeader() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false)
    }
    if (settingsOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [settingsOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[var(--background)]/90 backdrop-blur-md h-14">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 h-full">
        <Link href="/" className="flex items-center gap-2 font-bold text-base">
          <CardletIcon />
          <span>Cardlet</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="relative" ref={settingsRef}>
            <SettingsButton onClick={() => setSettingsOpen((o) => !o)} />
            <AnimatePresence>
              {settingsOpen && <SettingsDropdown onClose={() => setSettingsOpen(false)} />}
            </AnimatePresence>
          </div>
          <Link
            href="/login"
            className="rounded-full px-4 py-1.5 text-sm font-medium border border-[var(--card-border)] hover:bg-[var(--surface)] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="rounded-full px-4 py-1.5 text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: 'var(--cta)', color: 'var(--cta-text)' }}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}

function LoggedInHeader({ avatarUrl, isAdmin }: { avatarUrl: string | null; isAdmin: boolean }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false)
    }
    if (settingsOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [settingsOpen])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/explore?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[var(--background)]/90 backdrop-blur-md h-14">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 h-full">
          {/* Mobile hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden rounded-full p-2 -ml-1 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-2 font-bold text-base shrink-0">
            <CardletIcon size={26} />
            <span className="hidden sm:block">Cardlet</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-1 shrink-0">
            <Link
              href="/explore"
              className="rounded-full px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/solve"
              className="rounded-full px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
            >
              Equation Solver
            </Link>
          </nav>

          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search flashcard sets…"
                className="w-full rounded-full bg-[var(--surface)] border border-[var(--card-border)] pl-9 pr-4 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:bg-[var(--surface-raised)] transition-colors"
              />
            </div>
          </form>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-full bg-[var(--surface)] border border-[var(--card-border)] px-3 py-1.5 text-sm font-medium hover:border-[var(--accent)] hover:bg-[var(--surface-raised)] transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:block">Create</span>
            </button>

            {!isAdmin && (
              <Link
                href="/plans"
                className="rounded-full px-4 py-1.5 text-sm font-bold hidden md:block hover:opacity-90 transition-opacity"
                style={{ background: 'var(--cta)', color: 'var(--cta-text)' }}
              >
                Upgrade
              </Link>
            )}

            {/* Mobile credits widget — sits to the left of Settings + Profile */}
            {!isAdmin && (
              <div className="lg:hidden">
                <CircleProgress variant="header" />
              </div>
            )}

            <div className="relative" ref={settingsRef}>
              <SettingsButton onClick={() => setSettingsOpen((o) => !o)} />
              <AnimatePresence>
                {settingsOpen && <SettingsDropdown onClose={() => setSettingsOpen(false)} />}
              </AnimatePresence>
            </div>

            <Link
              href="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-white overflow-hidden shrink-0 hover:opacity-90 transition-opacity"
              aria-label="Profile"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </Link>
          </div>
        </div>
      </header>

      {showCreateModal && <CreateSetModal onClose={() => setShowCreateModal(false)} />}
      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}

export function Header() {
  const [authState, setAuthState] = useState<'loading' | 'authed' | 'anon'>('loading')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setAuthState('anon'); return }
      setAuthState('authed')
      const { data: profile } = await supabase
        .from('profiles').select('avatar_url, role').eq('id', user.id).single()
      if (profile) {
        setAvatarUrl(profile.avatar_url)
        setIsAdmin(profile.role === 'admin')
      }
    }
    check()
  }, [])

  if (authState === 'loading') {
    return (
      <header className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[var(--background)]/90 backdrop-blur-md h-14">
        <div className="mx-auto flex max-w-7xl items-center px-4 h-full">
          <Link href="/" className="flex items-center gap-2 font-bold text-base">
            <CardletIcon size={26} />
            <span>Cardlet</span>
          </Link>
        </div>
      </header>
    )
  }

  if (authState === 'anon') return <LoggedOutHeader />
  return <LoggedInHeader avatarUrl={avatarUrl} isAdmin={isAdmin} />
}
