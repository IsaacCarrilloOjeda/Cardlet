import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLanguageLeaderboard } from '@/lib/db'
import { LanguageLeaderboardClient } from '@/components/leaderboard/LanguageLeaderboardClient'
import { LANGUAGES } from '@/components/languages/lessonData'

const AVAILABLE = LANGUAGES.filter((l) => l.available).map((l) => l.id)

interface PageProps {
  searchParams: Promise<{ lang?: string }>
}

export default async function LanguageLeaderboardPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const lang = AVAILABLE.includes(params.lang ?? '') ? (params.lang as string) : AVAILABLE[0]

  let leaders: Awaited<ReturnType<typeof getLanguageLeaderboard>> = []
  let loadError: string | null = null
  try {
    leaders = await getLanguageLeaderboard(lang, 20)
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e)
    console.error('[language leaderboard] failed to load:', loadError)
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-2">Language leaderboard unavailable</h1>
        <p className="text-sm text-[var(--muted)] mb-4">
          The leaderboard couldn&apos;t load. Most likely <code className="rounded bg-[var(--card)] px-1.5 py-0.5">migrations/008_language_xp.sql</code> hasn&apos;t been applied yet.
        </p>
        <pre className="mt-4 max-w-full overflow-auto rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-3 text-left text-xs text-red-400">
          {loadError}
        </pre>
      </div>
    )
  }

  const available = LANGUAGES
    .filter((l) => l.available)
    .map((l) => ({ id: l.id, name: l.name, nativeName: l.nativeName, color: l.color }))

  return (
    <LanguageLeaderboardClient
      leaders={leaders}
      languages={available}
      currentLang={lang}
      currentUserId={user.id}
    />
  )
}
