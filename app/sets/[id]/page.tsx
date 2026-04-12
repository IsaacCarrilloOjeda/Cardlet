import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudySet, getCardsBySet } from '@/lib/db'
import { SetDetailClient } from '@/components/sets/SetDetailClient'

// Generate per-set metadata for Google (title, description, OG)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const set = await getStudySet(id)

  if (!set || !set.is_public) {
    return { title: 'Study Set' }
  }

  const title = `${set.title}${set.subject ? ` — ${set.subject}` : ''} Flashcards`
  const description =
    set.description ??
    `Study ${set.title}${set.subject ? ` (${set.subject})` : ''} with ${set.card_count ?? 0} AI-powered flashcards on Cardlet. Free to use.`

  return {
    title,
    description,
    openGraph: {
      title: `${set.title} Flashcards | Cardlet`,
      description,
      url: `https://cardlet.app/sets/${id}`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${set.title} Flashcards | Cardlet`,
      description,
    },
  }
}

export default async function SetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [set, cards] = await Promise.all([getStudySet(id), getCardsBySet(id)])

  if (!set) notFound()

  // Private set: only the owner can view it
  if (!set.is_public) {
    if (!user) redirect('/login')
    if (set.user_id !== user.id) notFound()
  }

  const isOwner = !!user && set.user_id === user.id
  const isGuest = !user

  return <SetDetailClient set={set} cards={cards} isOwner={isOwner} isGuest={isGuest} />
}
