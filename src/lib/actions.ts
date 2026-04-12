'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  createStudySet,
  updateStudySet,
  deleteStudySet,
  createCard,
  updateCard,
  deleteCard,
  bulkInsertCards,
  upsertCardProgress,
  upsertProfile,
  bumpStreak,
  copySetToUser,
  renameFolderInDB,
  deleteSetsInFolder,
  ungroupSetsInFolder,
  submitFeedback,
  updateFeedbackStatus,
  createStudyMaterial,
  deleteStudyMaterial,
  getStudyMaterialById,
  createAdminStudySet,
  bulkInsertCardsAdmin,
  setUserRole,
} from '@/lib/db'
import { computeSM2 } from '@/lib/sm2'
import { chatComplete } from '@/lib/openrouter'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  isAdminAuthenticated,
  verifyAdminPassword,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_VALUE,
} from '@/lib/admin-auth'
import type { FeedbackStatus, UserCardProgress } from '@/types'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

// ─── Study Sets ───────────────────────────────────────────────────────────────

export async function createStudySetAction(formData: FormData): Promise<{ id: string }> {
  const user = await getAuthUser()
  const set = await createStudySet(user.id, {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    subject: (formData.get('subject') as string) || null,
    is_public: formData.get('is_public') === 'true',
  })
  revalidatePath('/')
  return { id: set.id }
}

export async function updateStudySetAction(setId: string, formData: FormData): Promise<void> {
  await getAuthUser()
  await updateStudySet(setId, {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    subject: (formData.get('subject') as string) || null,
    is_public: formData.get('is_public') === 'true',
  })
  revalidatePath(`/sets/${setId}`)
  revalidatePath('/')
}

export async function deleteStudySetAction(setId: string): Promise<void> {
  await getAuthUser()
  await deleteStudySet(setId)
  revalidatePath('/')
}

export async function duplicateStudySetAction(setId: string): Promise<{ id: string }> {
  const user = await getAuthUser()
  const supabase = await createClient()

  // Fetch original set + cards in parallel
  const [{ data: original }, { data: origCards }] = await Promise.all([
    supabase.from('study_sets').select('*').eq('id', setId).single(),
    supabase.from('cards').select('*').eq('set_id', setId).order('created_at', { ascending: true }),
  ])
  if (!original) throw new Error('Set not found')

  // Create the copy (always private)
  const { data: newSet, error: setErr } = await supabase
    .from('study_sets')
    .insert({
      user_id: user.id,
      title: `${original.title} (Copy)`,
      description: original.description,
      subject: original.subject,
      is_public: false,
    })
    .select()
    .single()
  if (setErr || !newSet) throw new Error('Failed to duplicate set')

  // Copy cards if any
  if (origCards && origCards.length > 0) {
    const rows = origCards.map(({ front, back, difficulty, image_url }: { front: string; back: string; difficulty: number; image_url: string | null }) => ({
      set_id: newSet.id,
      front,
      back,
      difficulty,
      image_url: image_url ?? null,
    }))
    const { error: cardsErr } = await supabase.from('cards').insert(rows)
    if (cardsErr) throw new Error('Failed to copy cards')
  }

  revalidatePath('/')
  return { id: newSet.id }
}

// ─── Cards ───────────────────────────────────────────────────────────────────

export async function createCardAction(setId: string, formData: FormData): Promise<void> {
  await getAuthUser()
  await createCard({
    set_id: setId,
    front: formData.get('front') as string,
    back: formData.get('back') as string,
    difficulty: Number(formData.get('difficulty') ?? 3),
    image_url: (formData.get('image_url') as string) || null,
  })
  revalidatePath(`/sets/${setId}`)
}

export async function updateCardAction(cardId: string, setId: string, formData: FormData): Promise<void> {
  await getAuthUser()
  await updateCard(cardId, {
    front: formData.get('front') as string,
    back: formData.get('back') as string,
    difficulty: Number(formData.get('difficulty') ?? 3),
    image_url: (formData.get('image_url') as string) || null,
  })
  revalidatePath(`/sets/${setId}`)
}

export async function deleteCardAction(cardId: string, setId: string): Promise<void> {
  await getAuthUser()
  await deleteCard(cardId)
  revalidatePath(`/sets/${setId}`)
}

export async function bulkInsertCardsAction(
  setId: string,
  cards: { front: string; back: string; difficulty: number }[]
): Promise<void> {
  await getAuthUser()
  await bulkInsertCards(setId, cards)
  revalidatePath(`/sets/${setId}`)
}

export async function updateCardImproveAction(
  cardId: string,
  setId: string,
  front: string,
  back: string,
): Promise<void> {
  await getAuthUser()
  const supabase = await createClient()
  await supabase.from('cards').update({ front, back }).eq('id', cardId)
  revalidatePath(`/sets/${setId}`)
}

export async function setCardImageAction(
  cardId: string,
  setId: string,
  imageUrl: string,
): Promise<void> {
  await getAuthUser()
  const supabase = await createClient()
  await supabase.from('cards').update({ image_url: imageUrl }).eq('id', cardId)
  revalidatePath(`/sets/${setId}`)
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export async function updateCardProgressAction(
  cardId: string,
  quality: 0 | 1 | 2 | 3 | 4 | 5
): Promise<void> {
  const user = await getAuthUser()

  // Get current progress (may not exist)
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('user_card_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('card_id', cardId)
    .single()

  const current: Pick<UserCardProgress, 'ease_factor' | 'interval' | 'repetitions'> = existing ?? {
    ease_factor: 2.5,
    interval: 1,
    repetitions: 0,
  }

  const result = computeSM2(current, quality)

  await upsertCardProgress({
    user_id: user.id,
    card_id: cardId,
    ease_factor: result.ease_factor,
    interval: result.interval,
    repetitions: result.repetitions,
    next_review_at: result.next_review_at.toISOString(),
  })

  // Bump streak — same-day calls are no-ops in the RPC, so this is cheap.
  bumpStreak(user.id).catch((err) => console.error('bumpStreak failed:', err))
  // No revalidation — called fire-and-forget during study session
}

export async function bumpStreakAction(): Promise<{ streak: number }> {
  const user = await getAuthUser()
  const streak = await bumpStreak(user.id)
  return { streak }
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function updateProfileAction(formData: FormData): Promise<void> {
  const user = await getAuthUser()
  await upsertProfile({
    id: user.id,
    username: (formData.get('username') as string) || null,
    avatar_url: (formData.get('avatar_url') as string) || null,
    is_private: formData.get('is_private') === 'true',
  })
  revalidatePath('/profile')
}

export async function saveQuizResultAction(
  correct: number,
  total: number,
  pointsEarned: number = 0,
): Promise<void> {
  const user = await getAuthUser()
  const supabase = await createClient()
  const { error } = await supabase.rpc('increment_quiz_stats', {
    uid: user.id,
    correct_delta: correct,
    attempts_delta: total,
  })
  if (error) console.error('saveQuizResult failed:', error)

  if (pointsEarned > 0) {
    // XP grows 2× faster than leaderboard points so levels feel rewarding.
    const { error: pointsErr } = await supabase.rpc('add_points_and_xp', {
      uid: user.id,
      p_points: pointsEarned,
      p_xp: pointsEarned * 2,
    })
    if (pointsErr) console.error('add_points_and_xp failed:', pointsErr)
  }

  // Bump streak — quizzes count as study activity for the day.
  bumpStreak(user.id).catch((err) => console.error('bumpStreak failed:', err))
}

export async function addPointsAction(points: number): Promise<void> {
  if (points <= 0) return
  const user = await getAuthUser()
  const supabase = await createClient()
  const { error } = await supabase.rpc('add_points_and_xp', {
    uid: user.id,
    p_points: points,
    p_xp: points * 2,
  })
  if (error) console.error('addPoints failed:', error)
}

// ─── User Materials Upload (non-admin) ────────────────────────────────────────

export async function uploadUserMaterialAction(
  title: string,
  subject: string | null,
  text: string,
): Promise<{ id: string }> {
  const user = await getAuthUser()
  const admin = createAdminClient()

  // Save the transcribed text as a .txt file in the materials bucket.
  const uniqueName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.txt`
  const blob = new Blob([text], { type: 'text/plain' })

  const { error: uploadError } = await admin.storage
    .from('materials')
    .upload(uniqueName, blob, { contentType: 'text/plain', upsert: false })
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = admin.storage.from('materials').getPublicUrl(uniqueName)

  // Use admin client to bypass RLS for the insert (we already verified user)
  const { data: row, error } = await admin
    .from('study_materials')
    .insert({
      title,
      subject,
      description: null,
      file_url: publicUrl,
      file_name: uniqueName,
      file_size: blob.size,
      is_public: false,
      user_id: user.id,
    })
    .select('id')
    .single()
  if (error) throw error

  revalidatePath('/explore')
  return { id: row.id as string }
}

// ─── Explore ──────────────────────────────────────────────────────────────────

export async function copySetAction(setId: string): Promise<{ id: string }> {
  const user = await getAuthUser()
  const newSet = await copySetToUser(setId, user.id)
  revalidatePath('/')
  return { id: newSet.id }
}

// ─── Folder DB Sync ───────────────────────────────────────────────────────────

export async function renameFolderAction(oldSubject: string, newSubject: string): Promise<void> {
  const user = await getAuthUser()
  await renameFolderInDB(user.id, oldSubject, newSubject)
  revalidatePath('/')
}

export async function deleteFolderAndSetsAction(subject: string): Promise<void> {
  const user = await getAuthUser()
  await deleteSetsInFolder(user.id, subject)
  revalidatePath('/')
}

export async function ungroupFolderAction(subject: string): Promise<void> {
  const user = await getAuthUser()
  await ungroupSetsInFolder(user.id, subject)
  revalidatePath('/')
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export async function submitFeedbackAction(type: 'bug' | 'feature', message: string): Promise<void> {
  const user = await getAuthUser()
  await submitFeedback(user.id, type, message)
}

// ─── Admin Auth ───────────────────────────────────────────────────────────────

export async function adminLoginAction(password: string): Promise<{ success: boolean }> {
  if (!verifyAdminPassword(password)) return { success: false }
  const store = await cookies()
  store.set(ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, {
    httpOnly: true,
    path: '/admin',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8, // 8 hours
  })
  return { success: true }
}

export async function adminLogoutAction(): Promise<void> {
  const store = await cookies()
  store.delete(ADMIN_COOKIE_NAME)
  redirect('/admin')
}

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export async function adminUpdateFeedbackAction(id: string, status: FeedbackStatus): Promise<void> {
  if (!(await isAdminAuthenticated())) throw new Error('Unauthorized')
  await updateFeedbackStatus(id, status)
  revalidatePath('/admin/feedback')
}

export async function adminUploadMaterialAction(formData: FormData): Promise<{ id: string }> {
  if (!(await isAdminAuthenticated())) throw new Error('Unauthorized')

  const file = formData.get('file') as File
  const title = formData.get('title') as string
  const subject = (formData.get('subject') as string) || null
  const description = (formData.get('description') as string) || null
  const isPublic = formData.get('is_public') !== 'false'

  if (!file || !title) throw new Error('Missing required fields')

  const ext = file.name.split('.').pop() ?? 'bin'
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from('materials')
    .upload(uniqueName, file, { contentType: file.type, upsert: false })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = admin.storage.from('materials').getPublicUrl(uniqueName)

  const material = await createStudyMaterial({
    title,
    subject,
    description,
    file_url: publicUrl,
    file_name: uniqueName,
    file_size: file.size,
    is_public: isPublic,
  })

  revalidatePath('/admin/materials')
  return { id: material.id }
}

export async function adminDeleteMaterialAction(id: string, fileName: string): Promise<void> {
  if (!(await isAdminAuthenticated())) throw new Error('Unauthorized')
  await deleteStudyMaterial(id, fileName)
  revalidatePath('/admin/materials')
}

export async function adminSetUserRoleAction(userId: string, role: string): Promise<void> {
  if (!(await isAdminAuthenticated())) throw new Error('Unauthorized')
  await setUserRole(userId, role)
  revalidatePath('/admin/users')
}

export async function adminConvertMaterialToSetAction(materialId: string): Promise<{ id: string }> {
  if (!(await isAdminAuthenticated())) throw new Error('Unauthorized')

  const material = await getStudyMaterialById(materialId)
  if (!material) throw new Error('Material not found')

  const prompt = `Generate exactly 10 flashcards for the following study material.
Title: "${material.title}"
Subject: "${material.subject ?? 'General'}"
Description: "${material.description ?? ''}"

Return ONLY valid JSON with this structure:
{"cards": [{"front": "question", "back": "answer", "difficulty": 3}]}

Make the flashcards educational, clear, and accurate. Difficulty: 1=easy, 3=medium, 5=hard.`

  const resultText = await chatComplete(
    [{ role: 'user', content: prompt }],
    { jsonMode: true, maxTokens: 4096 }
  )

  let cards: { front: string; back: string; difficulty: number }[] = []
  try {
    const parsed = JSON.parse(resultText)
    cards = parsed.cards ?? []
  } catch {
    throw new Error('AI failed to generate cards')
  }

  const set = await createAdminStudySet({
    title: material.title,
    description: material.description,
    subject: material.subject,
    is_public: true,
  })

  await bulkInsertCardsAdmin(set.id, cards)
  revalidatePath('/admin/materials')
  revalidatePath('/explore')
  return { id: set.id }
}
