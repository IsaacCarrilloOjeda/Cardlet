import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudySet, getCardsBySet } from '@/lib/db'
import { QuizModeClient } from '@/components/quiz/QuizModeClient'

export default async function QuizPage({
  params,
}: {
  params: Promise<{ setId: string }>
}) {
  const { setId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [set, cards] = await Promise.all([getStudySet(setId), getCardsBySet(setId)])

  if (!set) notFound()

  return <QuizModeClient cards={cards} setId={setId} setTitle={set.title} />
}
