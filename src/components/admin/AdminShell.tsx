'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { adminLogoutAction } from '@/lib/actions'

const NAV = [
  { href: '/admin/overview', label: 'Overview', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/sets', label: 'Study Sets', icon: '📚' },
  { href: '/admin/materials', label: 'Materials', icon: '📁' },
  { href: '/admin/feedback', label: 'Feedback', icon: '💬' },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarContent = (
    <>
      <div className="px-4 py-5 border-b border-[var(--card-border)]">
        <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Admin Panel</p>
      </div>

      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-2 py-3 border-t border-[var(--card-border)]">
        <form action={adminLogoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <span className="text-base leading-none">🚪</span>
            Sign Out
          </button>
        </form>
      </div>
    </>
  )

  return (
    <div className="flex min-h-[calc(100vh-120px)]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-52 shrink-0 border-r border-[var(--card-border)] bg-[var(--card)] flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile: hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-[72px] left-3 z-40 flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-md hover:border-[var(--accent)] transition-colors"
        aria-label="Open admin menu"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          onClick={() => setMobileOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          {/* Drawer */}
          <aside
            className="relative w-52 shrink-0 bg-[var(--card)] border-r border-[var(--card-border)] flex flex-col h-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              aria-label="Close menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
