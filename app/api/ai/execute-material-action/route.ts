import { revalidatePath } from 'next/cache'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { chatComplete } from '@/lib/openrouter'
import { createAdminStudySet, bulkInsertCardsAdmin, createStudyMaterial } from '@/lib/db'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 120

export type ExecuteAction = 'flashcards' | 'outline' | 'summary' | 'sections'

export interface ExecuteResult {
  type: ExecuteAction
  // flashcards
  setId?: string
  cardCount?: number
  // outline / summary
  content?: string
  // sections
  sectionCount?: number
  materials?: Array<{ id: string; title: string }>
}

/**
 * AI 2 — Material Action Executor
 * Takes classified text from AI 1 and executes a chosen action.
 *
 * Actions:
 *   flashcards → generate cards, create admin study set, return setId
 *   summary    → compress into a summary document (markdown)
 *   outline    → build hierarchical outline (markdown)
 *   sections   → split into sub-topics, create a material per section
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    text: string
    action: ExecuteAction
    title: string
    subject?: string | null
    count?: number
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { text, action, title, subject, count = 20 } = body

  if (!text?.trim() || !action || !title?.trim()) {
    return Response.json({ error: 'text, action, and title are required' }, { status: 400 })
  }

  // Trim to stay within token budget
  const slice = text.slice(0, 14000)

  try {
    if (action === 'flashcards') {
      const clamped = Math.min(Math.max(count, 5), 50)

      const raw = await chatComplete(
        [
          {
            role: 'system',
            content:
              'You are a master flashcard creator. Extract the most important concepts, ' +
              'definitions, dates, formulas, and facts. Make each card self-contained. ' +
              'Return ONLY valid JSON — no markdown, no code fences.',
          },
          {
            role: 'user',
            content:
              `Generate exactly ${clamped} educational flashcards from the content below.\n` +
              `Title: "${title}" · Subject: "${subject ?? 'General'}"\n\n` +
              `${slice}\n\n` +
              `Return: {"cards":[{"front":"question or term","back":"answer or definition","difficulty":3}]}`,
          },
        ],
        { jsonMode: true, maxTokens: 6000 }
      )

      const parsed = JSON.parse(raw)
      const cards = (parsed.cards ?? [])
        .filter((c: { front?: string; back?: string }) => c.front && c.back)
        .map((c: { front: string; back: string; difficulty?: number }) => ({
          front: String(c.front).slice(0, 500),
          back: String(c.back).slice(0, 500),
          difficulty: [1, 2, 3, 4, 5].includes(c.difficulty ?? 3) ? (c.difficulty ?? 3) : 3,
        }))

      const set = await createAdminStudySet({
        title,
        subject: subject ?? null,
        description: `AI-generated from uploaded material.`,
        is_public: true,
      })
      await bulkInsertCardsAdmin(set.id, cards)

      revalidatePath('/admin/materials')
      revalidatePath('/explore')

      return Response.json({
        type: 'flashcards',
        setId: set.id,
        cardCount: cards.length,
      } satisfies ExecuteResult)
    }

    if (action === 'summary') {
      const content = await chatComplete(
        [
          {
            role: 'system',
            content:
              'You are an expert at creating concise, structured educational summaries. ' +
              'Preserve all key concepts, important terms, dates, and critical information. ' +
              'Use Markdown: ## for main sections, ### for sub-sections, bullet points for details. ' +
              'Start directly with the content — no preamble.',
          },
          {
            role: 'user',
            content: `Write a comprehensive summary of "${title}":\n\n${slice}`,
          },
        ],
        { maxTokens: 2500 }
      )

      return Response.json({ type: 'summary', content: content.trim() } satisfies ExecuteResult)
    }

    if (action === 'outline') {
      const content = await chatComplete(
        [
          {
            role: 'system',
            content:
              'You are an expert at organizing educational content into hierarchical outlines. ' +
              'Create a thorough, detailed outline that preserves all key information. ' +
              'Use Markdown: # title, ## main sections, ### subsections, bullet points for specifics. ' +
              'Start with # followed by the document title.',
          },
          {
            role: 'user',
            content: `Create a detailed structured outline for "${title}":\n\n${slice}`,
          },
        ],
        { maxTokens: 3500 }
      )

      return Response.json({ type: 'outline', content: content.trim() } satisfies ExecuteResult)
    }

    if (action === 'sections') {
      const raw = await chatComplete(
        [
          {
            role: 'system',
            content:
              'You split educational content into self-contained study sections. ' +
              'Each section covers one coherent topic and includes full explanations. ' +
              'Return ONLY valid JSON — no markdown, no code fences.',
          },
          {
            role: 'user',
            content:
              `Split "${title}" into 3–7 logical study sections.\n\n${slice}\n\n` +
              `Return: {"sections":[{"title":"Section Title","content":"full section text"}]}`,
          },
        ],
        { jsonMode: true, maxTokens: 6000 }
      )

      const parsed = JSON.parse(raw)
      const sections: Array<{ title: string; content: string }> = (parsed.sections ?? []).filter(
        (s: { title?: string; content?: string }) => s.title && s.content
      )

      const admin = createAdminClient()
      const createdMaterials: Array<{ id: string; title: string }> = []

      for (const section of sections) {
        const sectionTitle = `${title} — ${section.title}`
        const blob = new Blob([`# ${sectionTitle}\n\n${section.content}`], {
          type: 'text/plain',
        })
        const uniqueName = `sections/${Date.now()}-${Math.random().toString(36).slice(2)}.txt`

        const { error: uploadErr } = await admin.storage
          .from('materials')
          .upload(uniqueName, blob, { contentType: 'text/plain', upsert: false })

        if (uploadErr) continue

        const {
          data: { publicUrl },
        } = admin.storage.from('materials').getPublicUrl(uniqueName)

        const mat = await createStudyMaterial({
          title: sectionTitle,
          subject: subject ?? null,
          description: null,
          file_url: publicUrl,
          file_name: uniqueName,
          file_size: blob.size,
          is_public: true,
        })
        createdMaterials.push({ id: mat.id, title: mat.title })
      }

      revalidatePath('/admin/materials')

      return Response.json({
        type: 'sections',
        sectionCount: createdMaterials.length,
        materials: createdMaterials,
      } satisfies ExecuteResult)
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Execution failed' },
      { status: 500 }
    )
  }
}
