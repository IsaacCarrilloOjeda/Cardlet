import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLeaderboard } from '@/lib/db'
import type { LeaderboardEntry } from '@/lib/db'

const MEDALS = ['🥇', '🥈', '🥉']

function rankBadge(rank: number) {
  if (rank <= 3) return MEDALS[rank - 1]
  return `#${rank}`
}

function PodiumCard({ leader, rank }: { leader: LeaderboardEntry; rank: number }) {
  const isFirst = rank === 1
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border p-4 text-center transition-shadow ${
        isFirst
          ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-lg'
          : 'border-[var(--card-border)] bg-[var(--card)]'
      }`}
    >
      <p className="text-3xl mb-2">{MEDALS[rank - 1]}</p>
      <div className="w-12 h-12 rounded-full bg-[var(--accent)]/20 flex items-center justify-center mb-2">
        <span className="text-lg font-bold text-[var(--accent)]">
          {(leader.username ?? '?')[0].toUpperCase()}
        </span>
      </div>
      <p className="font-semibold text-sm truncate w-full">{leader.username ?? 'Anonymous'}</p>
      <p className="text-xs text-[var(--muted)] mt-0.5">{leader.score.toLocaleString()} pts</p>
      <p className="text-xs text-orange-400 mt-1">🔥 {leader.streak}d</p>
    </div>
  )
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const leaders = await getLeaderboard(10)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Top studiers · Score = streak × 50 + sets × 30 + cards × 8</p>
      </div>

      {leaders.length === 0 ? (
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-12 text-center">
          <p className="text-[var(--muted)]">No data yet — start studying to appear here! 🚀</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {leaders.length >= 3 && (
            <div className="mb-8 grid grid-cols-3 gap-3">
              {/* silver – gold – bronze order */}
              <PodiumCard leader={leaders[1]} rank={2} />
              <PodiumCard leader={leaders[0]} rank={1} />
              <PodiumCard leader={leaders[2]} rank={3} />
            </div>
          )}

          {/* Full table */}
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider px-5 py-3 border-b border-[var(--card-border)]">
              <span className="w-8">Rank</span>
              <span>User</span>
              <span className="text-right w-16">Streak</span>
              <span className="text-right w-16">Sets</span>
              <span className="text-right w-20">Score</span>
            </div>

            {leaders.map((leader, i) => {
              const rank = i + 1
              return (
                <div
                  key={leader.user_id}
                  className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 items-center px-5 py-3.5 border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--accent)]/5 transition-colors ${
                    rank <= 3 ? 'font-medium' : ''
                  }`}
                >
                  <span className="w-8 text-sm">{rankBadge(rank)}</span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--accent)] shrink-0">
                      {(leader.username ?? '?')[0].toUpperCase()}
                    </div>
                    <span className="text-sm">{leader.username ?? 'Anonymous'}</span>
                  </div>
                  <span className="text-right w-16 text-sm text-orange-400">🔥 {leader.streak}</span>
                  <span className="text-right w-16 text-sm text-[var(--muted)]">{Number(leader.set_count)}</span>
                  <span className="text-right w-20 text-sm font-semibold">{Number(leader.score).toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
