import { createClient } from '@/lib/supabase/server'
import {
  getUserStudySets,
  getDueCardCount,
  getProfile,
  getMistakeCardCount,
  getDailyChallengeCard,
} from '@/lib/db'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  const [sets, dueCount, profile, mistakeCount, dailyCard] = await Promise.all([
    getUserStudySets(user.id),
    getDueCardCount(user.id),
    getProfile(user.id),
    getMistakeCardCount(user.id),
    getDailyChallengeCard(),
  ])

  return (
    <DashboardClient
      sets={sets}
      dueCount={dueCount}
      streak={profile?.streak ?? 0}
      mistakeCount={mistakeCount}
      dailyCard={dailyCard}
    />
  )
}
