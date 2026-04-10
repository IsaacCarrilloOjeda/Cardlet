import { createClient } from '@/lib/supabase/server'
import { getUserStudySets, getDueCardCount } from '@/lib/db'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  const [sets, dueCount] = await Promise.all([
    getUserStudySets(user.id),
    getDueCardCount(user.id),
  ])

  return <DashboardClient sets={sets} dueCount={dueCount} />
}
