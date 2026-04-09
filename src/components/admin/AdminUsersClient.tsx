'use client'

import type { Profile } from '@/types'

interface Props { profiles: Profile[] }

export function AdminUsersClient({ profiles }: Props) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Users</h1>
      <p className="text-sm text-[var(--muted)] mb-6">{profiles.length} registered users</p>

      <div className="rounded-xl border border-[var(--card-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--card-border)] bg-[var(--card)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)]">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)]">Streak</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)]">Joined</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile, i) => (
              <tr
                key={profile.id}
                className={`border-b border-[var(--card-border)] last:border-0 ${i % 2 === 0 ? 'bg-[var(--background)]' : 'bg-[var(--card)]'}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--accent)]">
                        {(profile.username ?? '?')[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{profile.username ?? <span className="text-[var(--muted)] italic">unnamed</span>}</p>
                      <p className="text-[10px] text-[var(--muted)] font-mono">{profile.id.slice(0, 8)}…</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${profile.streak > 0 ? 'text-orange-400' : 'text-[var(--muted)]'}`}>
                    {profile.streak > 0 ? `🔥 ${profile.streak}` : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--muted)] text-xs">
                  {new Date(profile.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {profiles.length === 0 && (
          <div className="py-12 text-center text-[var(--muted)] text-sm">No users yet.</div>
        )}
      </div>
    </div>
  )
}
