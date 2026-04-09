import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserStudySets, getDueCardCount } from '@/lib/db'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [sets, dueCount] = await Promise.all([
    getUserStudySets(user.id),
    getDueCardCount(user.id),
  ])

  return <DashboardClient sets={sets} dueCount={dueCount} />
}
