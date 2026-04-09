import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudySet, getCardsBySet } from '@/lib/db'
import { SetDetailClient } from '@/components/sets/SetDetailClient'

export default async function SetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [set, cards] = await Promise.all([getStudySet(id), getCardsBySet(id)])

  if (!set) notFound()

  return <SetDetailClient set={set} cards={cards} />
}
