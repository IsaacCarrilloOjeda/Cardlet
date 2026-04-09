'use client'

import type { StudySet } from '@/types'

interface Props { sets: StudySet[] }

export function AdminSetsClient({ sets }: Props) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Study Sets</h1>
      <p className="text-sm text-[var(--muted)] mb-6">{sets.length} total sets</p>

      <div className="rounded-xl border border-[var(--card-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--card-border)] bg-[var(--card)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)]">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)]">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)]">Cards</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)]">Visibility</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)]">Created</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set, i) => (
              <tr
                key={set.id}
                className={`border-b border-[var(--card-border)] last:border-0 ${i % 2 === 0 ? 'bg-[var(--background)]' : 'bg-[var(--card)]'}`}
              >
                <td className="px-4 py-3">
                  <a
                    href={`/sets/${set.id}`}
                    className="font-medium hover:text-[var(--accent)] transition-colors"
                  >
                    {set.title}
                  </a>
                </td>
                <td className="px-4 py-3">
                  {set.subject ? (
                    <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                      {set.subject}
                    </span>
                  ) : (
                    <span className="text-[var(--muted)]">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">{set.card_count ?? 0}</td>
                <td className="px-4 py-3">
                  {set.is_public ? (
                    <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-400">Public</span>
                  ) : (
                    <span className="rounded-full bg-[var(--card-border)]/50 px-2 py-0.5 text-xs font-medium text-[var(--muted)]">Private</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--muted)] text-xs">
                  {new Date(set.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sets.length === 0 && (
          <div className="py-12 text-center text-[var(--muted)] text-sm">No sets yet.</div>
        )}
      </div>
    </div>
  )
}
