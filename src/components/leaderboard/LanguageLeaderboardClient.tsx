'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import type { LanguageLeaderboardEntry } from '@/lib/db'

interface LangOption { id: string; name: string; nativeName: string; color: string }

interface Props {
  leaders: LanguageLeaderboardEntry[]
  languages: LangOption[]
  currentLang: string
  currentUserId: string
}

const MEDALS = ['🥇', '🥈', '🥉']

function Avatar({ entry, size = 8 }: { entry: LanguageLeaderboardEntry; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full overflow-hidden shrink-0 flex items-center justify-center`
  const style = { background: 'color-mix(in srgb, var(--accent) 20%, transparent)' }
  if (!entry.is_private && entry.avatar_url) {
    return (
      <div className={cls} style={style}>
        <Image src={entry.avatar_url} alt="" width={64} height={64} unoptimized className="w-full h-full object-cover" />
      </div>
    )
  }
  return (
    <div className={cls} style={style}>
      <span className={`${size === 12 ? 'text-xl' : 'text-xs'} font-bold`} style={{ color: 'var(--accent)' }}>
        {(entry.display_name ?? '?')[0].toUpperCase()}
      </span>
    </div>
  )
}

export function LanguageLeaderboardClient({ leaders, languages, currentLang, currentUserId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const meIdx = leaders.findIndex((l) => l.user_id === currentUserId)
  const currentLangMeta = languages.find((l) => l.id === currentLang)

  function navigate(langId: string) {
    const params = new URLSearchParams({ lang: langId })
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Language leaderboard</h1>
          <p className="text-sm text-[var(--muted)] mt-1">XP earned per language across the community.</p>
        </div>
        <Link
          href="/leaderboard"
          className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          ← Main leaderboard
        </Link>
      </div>

      {/* Language tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {languages.map((l) => {
          const active = l.id === currentLang
          return (
            <button
              key={l.id}
              onClick={() => navigate(l.id)}
              className="rounded-xl px-3.5 py-2 text-sm font-bold transition-all active:scale-95"
              style={{
                background: active ? l.color : 'var(--surface)',
                color: active ? 'white' : 'var(--foreground)',
                border: `2px solid ${active ? l.color : 'var(--card-border)'}`,
              }}
            >
              <span className="mr-2">{l.nativeName}</span>
              <span className="opacity-75 font-semibold text-xs">{l.name}</span>
            </button>
          )
        })}
      </div>

      {leaders.length === 0 ? (
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-12 text-center">
          <p className="text-[var(--muted)]">
            No one has earned {currentLangMeta?.name ?? ''} XP yet. Finish a lesson to claim #1!
          </p>
          <Link
            href="/languages"
            className="inline-block mt-4 rounded-xl px-4 py-2 text-sm font-bold text-white"
            style={{ background: 'var(--accent)' }}
          >
            Start learning
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider px-5 py-3 border-b border-[var(--card-border)]">
            <span className="w-8">Rank</span>
            <span>User</span>
            <span className="text-right w-20">Lessons</span>
            <span className="text-right w-24">XP</span>
          </div>

          {leaders.map((l, i) => {
            const rank = i + 1
            const isMe = l.user_id === currentUserId
            return (
              <Link
                key={l.user_id}
                href={`/users/${l.user_id}`}
                className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-5 py-3.5 border-b border-[var(--card-border)] last:border-0 transition-colors"
                style={{
                  background: isMe ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : undefined,
                }}
              >
                <span className="w-8 text-sm font-bold">
                  {rank <= 3 ? MEDALS[rank - 1] : `#${rank}`}
                </span>
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar entry={l} />
                  <span className="text-sm truncate">
                    {l.display_name ?? 'Anonymous'}
                    {isMe && <span className="ml-2 text-xs font-bold" style={{ color: 'var(--accent)' }}>you</span>}
                  </span>
                </div>
                <span className="text-right w-20 text-sm text-[var(--muted)]">{l.lessons}</span>
                <span className="text-right w-24 text-sm font-bold" style={{ color: 'var(--accent)' }}>
                  {Number(l.xp).toLocaleString()} XP
                </span>
              </Link>
            )
          })}
        </div>
      )}

      {meIdx === -1 && leaders.length > 0 && (
        <p className="mt-4 text-xs text-center text-[var(--muted)]">
          You&apos;re not on this board yet — complete a {currentLangMeta?.name ?? ''} lesson to join.
        </p>
      )}
    </div>
  )
}
