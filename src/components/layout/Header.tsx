'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useTheme, ACCENT_COLORS, type AccentKey } from './ThemeProvider'
import { UserAvatar } from './UserAvatar' // Add this import

export function Header() {
  const { theme, toggle, accentKey, setAccent } = useTheme()
  const pathname = usePathname()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    if (settingsOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [settingsOpen])

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/explore', label: 'Explore' },
    { href: '/leaderboard', label: 'Leaderboard' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[var(--background)]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="text-[var(--accent)]">⚡</span>
          <span>Smart Stack</span>
        </Link>

        {/* Right side */}
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Profile - replaced with UserAvatar server component */}
          <UserAvatar />

          {/* Settings dropdown */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen((o) => !o)}
              aria-label="Settings"
              className={`rounded-md p-2 transition-colors ${settingsOpen ? 'text-[var(--foreground)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {settingsOpen && (
              <div className="absolute right-0 mt-1 w-60 rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xl py-2 z-50">
                {/* Theme */}
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
                  <span className="text-xs">{theme === 'dark' ? '☀️' : '🌙'}</span>
                </button>

                {/* Accent color */}
                <div className="mt-1 border-t border-[var(--card-border)] pt-2 px-3">
                  <p className="pb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">Accent Color</p>
                  <div className="grid grid-cols-4 gap-2 pb-2">
                    {(Object.entries(ACCENT_COLORS) as [AccentKey, typeof ACCENT_COLORS[AccentKey]][]).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => { setAccent(key); setSettingsOpen(false) }}
                        title={val.label}
                        className="flex flex-col items-center gap-1 group"
                      >
                        <span
                          className="w-7 h-7 rounded-full border-2 transition-transform group-hover:scale-110"
                          style={{
                            background: val.accent,
                            borderColor: accentKey === key ? val.accent : 'transparent',
                            boxShadow: accentKey === key ? `0 0 0 2px ${val.accent}40` : undefined,
                            outline: accentKey === key ? `2px solid ${val.accent}` : '2px solid transparent',
                            outlineOffset: '2px',
                          }}
                        />
                        <span className="text-[9px] text-[var(--muted)]">{val.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
