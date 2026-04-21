import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudySet, getPublicSetCards } from '@/lib/db'
import { StudySessionClient } from '@/components/study/StudySessionClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ setId: string }>
}): Promise<Metadata> {
  const { setId } = await params
  const set = await getStudySet(setId)

  if (!set || !set.is_public) {
    return { title: 'Study Set' }
  }

  const title = `Study ${set.title} — free flashcards on Cardlet`
  const description =
    set.description ??
    `Study ${set.title}${set.subject ? ` (${set.subject})` : ''} with ${set.card_count ?? 0} flashcards — no account needed.`

  return {
    title,
    description,
    openGraph: {
      title: `${set.title} — Free Flashcards | Cardlet`,
      description,
      url: `https://cardlet.app/study/${setId}/guest`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${set.title} — Free Flashcards | Cardlet`,
      description,
    },
  }
}

export default async function GuestStudyPage({
  params,
}: {
  params: Promise<{ setId: string }>
}) {
  const { setId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Authed users go to the real route so they don't lose SM-2 progress
  if (user) redirect(`/study/${setId}`)

  const set = await getStudySet(setId)
  if (!set) notFound()
  // Keep private sets private — guests cannot study them
  if (!set.is_public) notFound()

  const cards = await getPublicSetCards(setId)

  return (
    <StudySessionClient
      cards={cards}
      setId={setId}
      setTitle={set.title}
      guestMode
    />
  )
}
