import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/db'
import { ProfileClient } from '@/components/profile/ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile + stats in parallel
  const [profile, setsResult, cardsResult] = await Promise.all([
    getProfile(user.id),
    supabase.from('study_sets').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase
      .from('cards')
      .select('id', { count: 'exact', head: true })
      .in(
        'set_id',
        (await supabase.from('study_sets').select('id').eq('user_id', user.id)).data?.map((s) => s.id) ?? []
      ),
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
      profile={profile ?? { id: user.id, username: null, avatar_url: null, streak: 0, created_at: new Date().toISOString() }}
      stats={stats}
      email={user.email ?? ''}
    />
  )
}
