import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudySet, getDueCards } from '@/lib/db'
import { StudySessionClient } from '@/components/study/StudySessionClient'

export default async function StudyPage({
  params,
}: {
  params: Promise<{ setId: string }>
}) {
  const { setId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [set, cards] = await Promise.all([
    getStudySet(setId),
    getDueCards(user.id, setId),
  ])

  if (!set) notFound()

  return (
    <StudySessionClient
      cards={cards}
      setId={setId}
      setTitle={set.title}
    />
  )
}
