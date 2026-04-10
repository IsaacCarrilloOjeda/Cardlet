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

  const [leaders, subjects] = await Promise.all([
    getLeaderboardV2(mode, subject, 10),
    getDistinctSubjects(),
  ])

  return (
    <LeaderboardClient
      leaders={leaders}
      subjects={subjects}
      currentMode={mode}
      currentSubject={subject}
    />
  )
}
