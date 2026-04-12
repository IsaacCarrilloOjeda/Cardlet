'use client'

import { useTransition } from 'react'
import Image from 'next/image'
import { adminSetUserRoleAction } from '@/lib/actions'
import type { Profile } from '@/types'

interface Props { profiles: Profile[] }

const ROLES = ['student', 'teacher', 'admin'] as const

export function AdminUsersClient({ profiles }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleRoleChange(userId: string, role: string) {
    startTransition(async () => {
      await adminSetUserRoleAction(userId, role)
    })
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Users</h1>
      <p className="text-sm text-[var(--muted)] mb-6">{profiles.length} registered users</p>

      <div className="rounded-xl border border-[var(--card-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--card-border)] bg-[var(--card)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)]">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)]">Role</th>
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
                      <Image
                        src={profile.avatar_url}
                        alt=""
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-full object-cover"
                        unoptimized
                      />
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
                  <select
                    defaultValue={profile.role ?? 'student'}
                    disabled={isPending}
                    onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                    className="rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1 text-xs focus:border-[var(--accent)] focus:outline-none disabled:opacity-60"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${profile.streak > 0 ? 'text-orange-400' : 'text-[var(--muted)]'}`}>
                    {profile.streak > 0 ? `🔥\uFE0F ${profile.streak}` : '—'}
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
