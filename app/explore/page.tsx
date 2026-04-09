import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { searchPublicSets, getRecentPublicSets, getPublicStudyMaterials } from '@/lib/db'
import { ExploreClient } from '@/components/explore/ExploreClient'

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; mode?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { q = '', mode = 'sets' } = await searchParams

  const sets = mode === 'sets'
    ? (q ? await searchPublicSets(q) : await getRecentPublicSets())
    : []

  const materials = mode === 'materials'
    ? await getPublicStudyMaterials(q || undefined)
    : []

  return <ExploreClient sets={sets} materials={materials} query={q} mode={mode === 'materials' ? 'materials' : 'sets'} />
}
