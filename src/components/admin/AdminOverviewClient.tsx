'use client'

import type { AdminStats } from '@/types'

interface Props { stats: AdminStats }

const STAT_CARDS = [
  { key: 'totalUsers' as const, label: 'Total Users', icon: '👥' },
  { key: 'totalSets' as const, label: 'Study Sets', icon: '📚' },
  { key: 'totalCards' as const, label: 'Cards', icon: '🃏' },
  { key: 'totalMaterials' as const, label: 'Materials', icon: '📁' },
  { key: 'totalFeedback' as const, label: 'Feedback', icon: '💬' },
  { key: 'newFeedback' as const, label: 'New Feedback', icon: '🔔', highlight: true },
]

export function AdminOverviewClient({ stats }: Props) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Overview</h1>
      <p className="text-sm text-[var(--muted)] mb-6">Site-wide statistics</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {STAT_CARDS.map(({ key, label, icon, highlight }) => (
          <div
            key={key}
            className={`rounded-xl border p-4 ${
              highlight && stats[key] > 0
                ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                : 'border-[var(--card-border)] bg-[var(--card)]'
            }`}
          >
            <p className="text-xl mb-2">{icon}</p>
            <p className={`text-2xl font-bold ${highlight && stats[key] > 0 ? 'text-[var(--accent)]' : ''}`}>
              {stats[key]}
            </p>
            <p className="text-xs text-[var(--muted)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold mb-3">Quick Links</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <a href="/admin/feedback" className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
            💬 View Feedback
          </a>
          <a href="/admin/materials" className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
            📁 Upload Material
          </a>
          <a href="/admin/users" className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
            👥 View Users
          </a>
          <a href="/explore" className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
            🔍 Explore (public)
          </a>
        </div>
      </div>
    </div>
  )
}
