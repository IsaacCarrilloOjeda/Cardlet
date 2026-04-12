import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudyBuddyClient } from '@/components/study/StudyBuddyClient'

interface PageProps {
  searchParams: Promise<{ session?: string; set?: string }>
}

export default async function StudyBuddyPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Pull user's sets so they can pick one to host
  const { data: sets } = await supabase
    .from('study_sets')
    .select('id, title')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <StudyBuddyClient
      userId={user.id}
      mySets={sets ?? []}
      initialSessionId={params.session ?? null}
      initialSetId={params.set ?? null}
    />
  )
}
