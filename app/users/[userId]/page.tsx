import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getPublicProfile, getPublicSetsByUser, getCardsStudiedCount } from '@/lib/db'

interface Props {
  params: Promise<{ userId: string }>
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'teacher') return <span title="Teacher" className="ml-1">📚</span>
  if (role === 'admin')   return <span title="Admin"   className="ml-1">⚙️</span>
  return null
}

export default async function UserProfilePage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { userId } = await params

  const [profile, publicSets] = await Promise.all([
    getPublicProfile(userId),
    getPublicSetsByUser(userId),
  ])

  if (!profile) notFound()

  const cardsStudied = await getCardsStudiedCount(userId)

  const isPrivate = profile.is_private
  const displayName = isPrivate
    ? `user${userId.slice(0, 6)}`
    : (profile.username ?? `user${userId.slice(0, 6)}`)
  const avatarUrl = isPrivate ? null : profile.avatar_url

  const quizAccuracy = profile.quiz_attempts > 0
    ? Math.round((profile.quiz_correct / profile.quiz_attempts) * 100)
    : null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/leaderboard"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-6"
      >
        ← Leaderboard
      </Link>

      {/* Identity header */}
      <div className="mb-8 flex items-center gap-5">
        <div className="h-20 w-20 rounded-full bg-[var(--accent)]/20 flex items-center justify-center overflow-hidden shrink-0 border-2 border-[var(--card-border)]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-[var(--accent)]">
              {displayName[0].toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            {displayName}
            <RoleBadge role={profile.role} />
          </h1>
          {isPrivate && (
            <p className="text-xs text-[var(--muted)] mt-0.5">Private account</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 text-center">
          <p className="text-3xl font-bold text-orange-400">{profile.streak}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Day Streak {'🔥\uFE0F'}</p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 text-center">
          <p className="text-3xl font-bold">{cardsStudied.toLocaleString()}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Cards Studied</p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 text-center">
          <p className="text-3xl font-bold">
            {quizAccuracy !== null ? `${quizAccuracy}%` : '—'}
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">Quiz Accuracy</p>
        </div>
      </div>

      {/* Public sets */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Public Sets <span className="text-[var(--muted)] font-normal text-base">({publicSets.length})</span>
        </h2>
        {publicSets.length === 0 ? (
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--muted)]">
            No public sets yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {publicSets.map((set) => (
              <Link
                key={set.id}
                href={`/sets/${set.id}`}
                className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 hover:border-[var(--accent)] transition-colors"
              >
                <p className="font-medium text-sm">{set.title}</p>
                {set.subject && (
                  <span className="inline-block mt-1 rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-xs text-[var(--accent)]">
                    {set.subject}
                  </span>
                )}
                <p className="mt-2 text-xs text-[var(--muted)]">{set.card_count ?? 0} cards</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
