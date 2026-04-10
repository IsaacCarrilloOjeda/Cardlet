'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  folders: string[]
  folderSetCounts: Record<string, number>
  activeFolder: string | null
  onSelectFolder: (folder: string | null) => void
  onAddFolder: () => void
}

function getFolderIcon(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes('math') || lower.includes('calc') || lower.includes('algebra') || lower.includes('geometry')) return '📐'
  if (lower.includes('science') || lower.includes('bio') || lower.includes('chem') || lower.includes('phys')) return '🔬'
  if (lower.includes('history') || lower.includes('geo') || lower.includes('aphg')) return '🌍'
  if (lower.includes('english') || lower.includes('lit') || lower.includes('writing')) return '📚'
  if (lower.includes('language') || lower.includes('spanish') || lower.includes('french') || lower.includes('latin')) return '🗣️'
  if (lower.includes('art') || lower.includes('music')) return '🎨'
  if (lower.includes('computer') || lower.includes('code') || lower.includes('program')) return '💻'
  return '📁'
}

export function DashboardSidebar({ folders, folderSetCounts, activeFolder, onSelectFolder, onAddFolder }: Props) {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: '/explore',
      label: 'Explore',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      href: '/leaderboard',
      label: 'Leaderboard',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ]

  return (
    <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-[var(--card-border)] bg-[var(--surface)] min-h-[calc(100vh-56px)] py-4 px-2 sticky top-14 self-start overflow-y-auto max-h-[calc(100vh-56px)]">
      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 mb-6">
        {navItems.map((item) => {
          const active = pathname === item.href && item.href !== '/' ? true : item.href === '/' && pathname === '/'
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => item.href === '/' && onSelectFolder(null)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active && !activeFolder
                  ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                  : 'text-[var(--muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Subjects */}
      <div>
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Your Subjects</p>
        <div className="flex flex-col gap-0.5">
          {folders.map((folder) => (
            <button
              key={folder}
              onClick={() => onSelectFolder(folder)}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeFolder === folder
                  ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                  : 'text-[var(--muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">{getFolderIcon(folder)}</span>
                <span className="truncate max-w-[100px]">{folder}</span>
              </span>
              {(folderSetCounts[folder] ?? 0) > 0 && (
                <span className="rounded-full bg-[var(--surface-raised)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                  {folderSetCounts[folder]}
                </span>
              )}
            </button>
          ))}

          {/* Add subject */}
          <button
            onClick={onAddFolder}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--accent)] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Subject
          </button>
        </div>
      </div>
    </aside>
  )
}
