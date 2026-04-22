'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import type { LeaderboardEntry } from '@/lib/db'

const MODES = [
  { id: 'score',         label: 'Score' },
  { id: 'streak',        label: 'Streak' },
  { id: 'cards_studied', label: 'Cards Studied' },
  { id: 'quiz_accuracy', label: 'Quiz Accuracy' },
] as const

const MEDALS = ['🥇', '🥈', '🥉']

interface Props {
  leaders: LeaderboardEntry[]
  subjects: string[]
  currentMode: string
  currentSubject: string | null
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'teacher') return <span title="Teacher" className="text-sm leading-none">📚</span>
  if (role === 'admin')   return <span title="Admin"   className="text-sm leading-none">⚙️</span>
  return null
}

function AvatarCircle({ entry, size = 8 }: { entry: LeaderboardEntry; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[var(--accent)]/20`
  if (!entry.is_private && entry.avatar_url) {
    return (
      <div className={cls}>
        <Image
          src={entry.avatar_url}
          alt=""
          width={64}
          height={64}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    )
  }
  return (
    <div className={cls}>
      <span className={`text-${size === 12 ? 'xl' : 'xs'} font-bold text-[var(--accent)]`}>
        {(entry.display_name ?? '?')[0].toUpperCase()}
      </span>
    </div>
  )
}

function formatStat(entry: LeaderboardEntry, mode: string): string {
  switch (mode) {
    case 'streak':        return `🔥\uFE0F ${entry.streak}d`
    case 'cards_studied': return `${Number(entry.cards_studied).toLocaleString()} cards`
    case 'quiz_accuracy':
      return entry.quiz_attempts > 0
        ? `${Math.round((Number(entry.quiz_correct) / Number(entry.quiz_attempts)) * 100)}%`
        : '—'
    default: return `${Number(entry.score).toLocaleString()} pts`
  }
}

export function LeaderboardClient({ leaders, subjects, currentMode, currentSubject }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function navigate(mode: string, subject: string | null) {
    const params = new URLSearchParams()
    params.set('mode', mode)
    if (subject) params.set('subject', subject)
    router.push(`${pathname}?${params.toString()}`)
  }

  const top3 = leaders.slice(0, 3)
  // Podium order: silver(2nd), gold(1st), bronze(3rd)
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3
  const podiumRanks = [2, 1, 3]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Score = streak × 50 + sets × 30 + cards studied × 8</p>
        </div>
        <Link
          href="/leaderboard/languages"
          className="shrink-0 rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
        >
          Languages →
        </Link>
      </div>

      {/* Mode tabs */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => navigate(m.id, currentSubject)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors active:scale-95 ${
              currentMode === m.id
                ? 'bg-[var(--accent)] text-white'
                : 'border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Subject filter */}
      {subjects.length > 0 && (
        <div className="mb-6">
          <select
            value={currentSubject ?? ''}
            onChange={(e) => navigate(currentMode, e.target.value || null)}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {leaders.length === 0 ? (
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-12 text-center">
          <p className="text-[var(--muted)]">No data yet — start studying to appear here! 🚀</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 3 && (
            <div className="mb-8 grid grid-cols-3 gap-3">
              {podiumOrder.map((leader, idx) => {
                const rank = podiumRanks[idx]
                const isFirst = rank === 1
                return (
                  <Link
                    key={leader.user_id}
                    href={`/users/${leader.user_id}`}
                    className={`flex flex-col items-center rounded-2xl border p-4 text-center transition-shadow hover:shadow-lg ${
                      isFirst
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-lg'
                        : 'border-[var(--card-border)] bg-[var(--card)]'
                    }`}
                  >
                    <p className="text-3xl mb-2">{MEDALS[rank - 1]}</p>
                    <AvatarCircle entry={leader} size={12} />
                    <p className="font-semibold text-sm truncate w-full mt-2 flex items-center justify-center gap-1">
                      {leader.display_name ?? 'Anonymous'}
                      <RoleBadge role={leader.role} />
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{formatStat(leader, currentMode)}</p>
                    <p className="text-xs text-orange-400 mt-1">{'🔥\uFE0F'} {leader.streak}d</p>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Full table */}
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto] text-xs font-semibold text-[var(--muted)] uppercase tracking-wider px-5 py-3 border-b border-[var(--card-border)]">
              <span className="w-8">Rank</span>
              <span>User</span>
              <span className="text-right w-28">{MODES.find((m) => m.id === currentMode)?.label}</span>
            </div>

            {leaders.map((leader, i) => {
              const rank = i + 1
              return (
                <Link
                  key={leader.user_id}
                  href={`/users/${leader.user_id}`}
                  className={`grid grid-cols-[auto_1fr_auto] items-center px-5 py-3.5 border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--accent)]/5 transition-colors ${
                    rank <= 3 ? 'font-medium' : ''
                  }`}
                >
                  <span className="w-8 text-sm">{rank <= 3 ? MEDALS[rank - 1] : `#${rank}`}</span>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AvatarCircle entry={leader} size={8} />
                    <span className="text-sm flex items-center gap-1 truncate">
                      {leader.display_name ?? 'Anonymous'}
                      <RoleBadge role={leader.role} />
                    </span>
                  </div>
                  <span className="text-right w-28 text-sm font-semibold">{formatStat(leader, currentMode)}</span>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
