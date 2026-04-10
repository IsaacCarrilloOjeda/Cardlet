import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AdminStats, Card, CardWithProgress, Feedback, FeedbackStatus, Profile, StudyMaterial, StudySet, UserCardProgress } from '@/types'

// ─── Study Sets ───────────────────────────────────────────────────────────────

export async function getUserStudySets(userId: string): Promise<StudySet[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('study_sets')
    .select('*, cards(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => ({
    ...row,
    card_count: (row.cards as unknown as { count: number }[])[0]?.count ?? 0,
    cards: undefined,
  })) as StudySet[]
}

export async function getStudySet(setId: string): Promise<StudySet | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('study_sets')
    .select('*, cards(count)')
    .eq('id', setId)
    .single()

  if (error) return null

  return {
    ...data,
    card_count: (data.cards as unknown as { count: number }[])[0]?.count ?? 0,
    cards: undefined,
  } as StudySet
}

export async function createStudySet(
  userId: string,
  data: Pick<StudySet, 'title' | 'description' | 'subject' | 'is_public'>
): Promise<StudySet> {
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('study_sets')
    .insert({ ...data, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return row as StudySet
}

export async function updateStudySet(
  setId: string,
  data: Partial<Pick<StudySet, 'title' | 'description' | 'subject' | 'is_public'>>
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('study_sets').update(data).eq('id', setId)
  if (error) throw error
}

export async function deleteStudySet(setId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('study_sets').delete().eq('id', setId)
  if (error) throw error
}

// ─── Cards ───────────────────────────────────────────────────────────────────

export async function getCardsBySet(setId: string): Promise<Card[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('set_id', setId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Card[]
}

export async function createCard(
  data: Pick<Card, 'set_id' | 'front' | 'back' | 'difficulty'> & { image_url?: string | null }
): Promise<Card> {
  const supabase = await createClient()
  const { data: row, error } = await supabase.from('cards').insert(data).select().single()
  if (error) throw error
  return row as Card
}

export async function updateCard(
  cardId: string,
  data: Partial<Pick<Card, 'front' | 'back' | 'image_url' | 'difficulty'>>
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('cards').update(data).eq('id', cardId)
  if (error) throw error
}

export async function deleteCard(cardId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('cards').delete().eq('id', cardId)
  if (error) throw error
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export async function getDueCardCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('user_card_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('next_review_at', new Date().toISOString())

  if (error) throw error
  return count ?? 0
}

export async function getDueCards(userId: string, setId: string): Promise<CardWithProgress[]> {
  const supabase = await createClient()

  // All cards in the set
  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('*')
    .eq('set_id', setId)
    .order('created_at', { ascending: true })

  if (cardsError) throw cardsError
  if (!cards || cards.length === 0) return []

  const cardIds = cards.map((c) => c.id)

  // Progress records for these cards
  const { data: progress, error: progError } = await supabase
    .from('user_card_progress')
    .select('*')
    .eq('user_id', userId)
    .in('card_id', cardIds)

  if (progError) throw progError

  const progressMap = new Map<string, UserCardProgress>()
  for (const p of progress ?? []) {
    progressMap.set(p.card_id, p as UserCardProgress)
  }

  const now = new Date()

  // Sort: due first, then new (no record), then not yet due
  const withProgress: CardWithProgress[] = (cards as Card[]).map((card) => ({
    ...card,
    progress: progressMap.get(card.id) ?? null,
  }))

  withProgress.sort((a, b) => {
    const aDue = !a.progress || (a.progress.next_review_at && new Date(a.progress.next_review_at) <= now)
    const bDue = !b.progress || (b.progress.next_review_at && new Date(b.progress.next_review_at) <= now)
    if (aDue && !bDue) return -1
    if (!aDue && bDue) return 1
    // Both due: sort by next_review_at ascending (earliest first)
    if (aDue && bDue) {
      const aDate = a.progress?.next_review_at ? new Date(a.progress.next_review_at).getTime() : 0
      const bDate = b.progress?.next_review_at ? new Date(b.progress.next_review_at).getTime() : 0
      return aDate - bDate
    }
    return 0
  })

  return withProgress
}

export async function upsertCardProgress(data: UserCardProgress): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('user_card_progress').upsert(data, {
    onConflict: 'user_id,card_id',
  })
  if (error) throw error
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data as Profile
}

export async function upsertProfile(data: Partial<Profile> & { id: string }): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').upsert(data, { onConflict: 'id' })
  if (error) throw error
}

// ─── Explore ──────────────────────────────────────────────────────────────────

export async function searchPublicSets(query: string): Promise<StudySet[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('study_sets')
    .select('*, cards(count)')
    .eq('is_public', true)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,subject.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  return (data ?? []).map((row) => ({
    ...row,
    card_count: (row.cards as unknown as { count: number }[])[0]?.count ?? 0,
    cards: undefined,
  })) as StudySet[]
}

export async function getRecentPublicSets(): Promise<StudySet[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('study_sets')
    .select('*, cards(count)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) throw error

  return (data ?? []).map((row) => ({
    ...row,
    card_count: (row.cards as unknown as { count: number }[])[0]?.count ?? 0,
    cards: undefined,
  })) as StudySet[]
}

// ─── Folder DB Sync ───────────────────────────────────────────────────────────

export async function renameFolderInDB(userId: string, oldSubject: string, newSubject: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('study_sets')
    .update({ subject: newSubject })
    .eq('user_id', userId)
    .ilike('subject', oldSubject)
  if (error) throw error
}

export async function deleteSetsInFolder(userId: string, subject: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('study_sets')
    .delete()
    .eq('user_id', userId)
    .ilike('subject', subject)
  if (error) throw error
}

export async function ungroupSetsInFolder(userId: string, subject: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('study_sets')
    .update({ subject: null })
    .eq('user_id', userId)
    .ilike('subject', subject)
  if (error) throw error
}

// ─── Feedback (user-facing) ───────────────────────────────────────────────────

export async function submitFeedback(userId: string, type: 'bug' | 'feature', message: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('feedback')
    .insert({ user_id: userId, type, message, status: 'new' })
  if (error) throw error
}

// ─── Study Materials (public explore) ────────────────────────────────────────

export async function getPublicStudyMaterials(query?: string): Promise<StudyMaterial[]> {
  const supabase = await createClient()
  let q = supabase
    .from('study_materials')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50)

  if (query) {
    q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%,subject.ilike.%${query}%`)
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as StudyMaterial[]
}

// ─── Admin DB Queries (service-role) ─────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const admin = createAdminClient()

  const [users, sets, cards, materials, allFeedback, newFeedback] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('study_sets').select('*', { count: 'exact', head: true }),
    admin.from('cards').select('*', { count: 'exact', head: true }),
    admin.from('study_materials').select('*', { count: 'exact', head: true }),
    admin.from('feedback').select('*', { count: 'exact', head: true }),
    admin.from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'new'),
  ])

  return {
    totalUsers: users.count ?? 0,
    totalSets: sets.count ?? 0,
    totalCards: cards.count ?? 0,
    totalMaterials: materials.count ?? 0,
    totalFeedback: allFeedback.count ?? 0,
    newFeedback: newFeedback.count ?? 0,
  }
}

export async function getAllProfiles(): Promise<Profile[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function getAllStudySetsAdmin(): Promise<StudySet[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('study_sets')
    .select('*, cards(count)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    card_count: (row.cards as unknown as { count: number }[])[0]?.count ?? 0,
    cards: undefined,
  })) as StudySet[]
}

export async function getAllFeedback(): Promise<Feedback[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Feedback[]
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('feedback').update({ status }).eq('id', id)
  if (error) throw error
}

export async function getAllStudyMaterials(): Promise<StudyMaterial[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('study_materials')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as StudyMaterial[]
}

export async function createStudyMaterial(
  data: Omit<StudyMaterial, 'id' | 'created_at'>
): Promise<StudyMaterial> {
  const admin = createAdminClient()
  const { data: row, error } = await admin
    .from('study_materials')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row as StudyMaterial
}

export async function deleteStudyMaterial(id: string, fileName: string): Promise<void> {
  const admin = createAdminClient()
  // Delete from storage first
  await admin.storage.from('materials').remove([fileName])
  // Delete DB row
  const { error } = await admin.from('study_materials').delete().eq('id', id)
  if (error) throw error
}

export async function getStudyMaterialById(id: string): Promise<StudyMaterial | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('study_materials')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as StudyMaterial
}

export async function createAdminStudySet(
  data: Pick<StudySet, 'title' | 'description' | 'subject' | 'is_public'>
): Promise<StudySet> {
  const admin = createAdminClient()
  const { data: row, error } = await admin
    .from('study_sets')
    .insert({ ...data, user_id: null })
    .select()
    .single()
  if (error) throw error
  return row as StudySet
}

export async function bulkInsertCardsAdmin(
  setId: string,
  cards: Array<{ front: string; back: string; difficulty: number }>
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('cards')
    .insert(cards.map((c) => ({ ...c, set_id: setId })))
  if (error) throw error
}

export interface LeaderboardEntry {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  is_private: boolean
  role: string
  streak: number
  set_count: number
  cards_studied: number
  quiz_correct: number
  quiz_attempts: number
  score: number
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('get_leaderboard', { lim: limit })
  if (error) throw error
  return (data ?? []) as LeaderboardEntry[]
}

export async function getLeaderboardV2(
  mode = 'score',
  subjectFilter: string | null = null,
  limit = 10
): Promise<LeaderboardEntry[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('get_leaderboard_v2', {
    mode,
    subject_filter: subjectFilter,
    lim: limit,
  })
  if (error) throw error
  return (data ?? []) as LeaderboardEntry[]
}

export async function getDistinctSubjects(): Promise<string[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('get_distinct_subjects')
  if (error) throw error
  return (data ?? []).map((row: { subject: string }) => row.subject)
}

export async function getPublicProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data as Profile
}

export async function getPublicSetsByUser(userId: string): Promise<StudySet[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('study_sets')
    .select('*, cards(count)')
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    card_count: (row.cards as unknown as { count: number }[])[0]?.count ?? 0,
    cards: undefined,
  })) as StudySet[]
}

export async function getCardsStudiedCount(userId: string): Promise<number> {
  const admin = createAdminClient() // admin needed — RLS blocks reading other users' progress
  const { count, error } = await admin
    .from('user_card_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (error) throw error
  return count ?? 0
}

export async function setUserRole(userId: string, role: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ role }).eq('id', userId)
  if (error) throw error
}

export async function copySetToUser(setId: string, userId: string): Promise<StudySet> {
  const supabase = await createClient()

  // Fetch source set
  const { data: sourceSet, error: setError } = await supabase
    .from('study_sets')
    .select('*')
    .eq('id', setId)
    .single()

  if (setError || !sourceSet) throw new Error('Set not found')

  // Fetch source cards
  const { data: sourceCards, error: cardsError } = await supabase
    .from('cards')
    .select('*')
    .eq('set_id', setId)

  if (cardsError) throw cardsError

  // Create new set
  const { data: newSet, error: createError } = await supabase
    .from('study_sets')
    .insert({
      user_id: userId,
      title: `${sourceSet.title} (copy)`,
      description: sourceSet.description,
      subject: sourceSet.subject,
      is_public: false,
    })
    .select()
    .single()

  if (createError || !newSet) throw new Error('Failed to copy set')

  // Insert copied cards
  if (sourceCards && sourceCards.length > 0) {
    const newCards = sourceCards.map(({ id: _id, set_id: _setId, created_at: _ca, ...card }) => ({
      ...card,
      set_id: newSet.id,
    }))
    const { error: insertError } = await supabase.from('cards').insert(newCards)
    if (insertError) throw insertError
  }

  return newSet as StudySet
}
