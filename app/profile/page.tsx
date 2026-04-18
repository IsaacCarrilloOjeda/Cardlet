import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile, getStudyActivity } from '@/lib/db'
import { ProfileClient } from '@/components/profile/ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile + stats truly in parallel. Card count uses an inner join
  // through study_sets so it doesn't depend on a prior set-id lookup.
  const [profile, setsResult, cardsResult, activity] = await Promise.all([
    getProfile(user.id),
    supabase.from('study_sets').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase
      .from('cards')
      .select('id, study_sets!inner(user_id)', { count: 'exact', head: true })
      .eq('study_sets.user_id', user.id),
    getStudyActivity(user.id),
  ])

  const stats = {
    setCount: setsResult.count ?? 0,
    cardCount: cardsResult.count ?? 0,
  }

  // Auto-create profile if missing
  if (!profile) {
    await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id' })
  }

  return (
    <ProfileClient
      profile={profile ?? { id: user.id, username: null, avatar_url: null, streak: 0, created_at: new Date().toISOString(), is_private: false, role: 'student', quiz_correct: 0, quiz_attempts: 0 }}
      stats={stats}
      email={user.email ?? ''}
      activity={activity}
    />
  )
}
