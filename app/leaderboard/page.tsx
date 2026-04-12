import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLeaderboardV2, getDistinctSubjects } from '@/lib/db'
import { LeaderboardClient } from '@/components/leaderboard/LeaderboardClient'

const VALID_MODES = ['score', 'streak', 'cards_studied', 'quiz_accuracy']

interface PageProps {
  searchParams: Promise<{ mode?: string; subject?: string }>
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const mode = VALID_MODES.includes(params.mode ?? '') ? (params.mode as string) : 'score'
  const subject = params.subject ?? null

  let leaders: Awaited<ReturnType<typeof getLeaderboardV2>> = []
  let subjects: string[] = []
  let loadError: string | null = null
  try {
    ;[leaders, subjects] = await Promise.all([
      getLeaderboardV2(mode, subject, 10),
      getDistinctSubjects(),
    ])
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e)
    console.error('[leaderboard] failed to load:', loadError)
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-2">Leaderboard unavailable</h1>
        <p className="text-sm text-[var(--muted)] mb-4">
          The leaderboard couldn&apos;t load. Most likely the database migration hasn&apos;t been
          applied yet — run <code className="rounded bg-[var(--card)] px-1.5 py-0.5">migrations/004_privacy_roles_accuracy.sql</code> in
          the Supabase SQL editor.
        </p>
        <pre className="mt-4 max-w-full overflow-auto rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-3 text-left text-xs text-red-400">
          {loadError}
        </pre>
      </div>
    )
  }

  return (
    <LeaderboardClient
      leaders={leaders}
      subjects={subjects}
      currentMode={mode}
      currentSubject={subject}
    />
  )
}
