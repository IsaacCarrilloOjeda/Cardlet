import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { searchPublicSets, getRecentPublicSets, getPublicStudyMaterials } from '@/lib/db'
import { ExploreClient } from '@/components/explore/ExploreClient'

export const metadata: Metadata = {
  title: 'Explore Flashcard Sets',
  description:
    'Browse thousands of free flashcard sets on Cardlet. Study biology, history, languages, math, and more — created by students and teachers.',
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; mode?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // No login required — public sets are readable by everyone
  const { q = '', mode = 'sets' } = await searchParams

  const sets =
    mode === 'sets'
      ? q
        ? await searchPublicSets(q)
        : await getRecentPublicSets()
      : []

  const materials = mode === 'materials' ? await getPublicStudyMaterials(q || undefined) : []

  return (
    <ExploreClient
      sets={sets}
      materials={materials}
      query={q}
      mode={mode === 'materials' ? 'materials' : 'sets'}
      isLoggedIn={!!user}
    />
  )
}
