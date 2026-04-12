import { createClient } from '@/lib/supabase/server'
import { chatComplete } from '@/lib/openrouter'

/**
 * Accept either raw text extracted client-side OR a base64 PDF.
 * Client should prefer text extraction (e.g., pdf.js) and POST { text }.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { text?: string; count?: number }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { text, count = 15 } = body
  if (!text?.trim()) return Response.json({ error: 'text required' }, { status: 400 })

  const clamped = Math.min(Math.max(count, 5), 30)
  // Trim to keep within token limits
  const slice = text.slice(0, 12000)

  let result: string
  try {
    result = await chatComplete(
      [
        {
          role: 'system',
          content:
            'You convert long-form documents into flashcards. Pull out the key terms, dates, definitions, and concepts. ' +
            'Return JSON: {"cards": [{"front": "...", "back": "...", "difficulty": 3}]}.',
        },
        { role: 'user', content: `Generate ${clamped} flashcards from this PDF text:\n\n${slice}` },
      ],
      { jsonMode: true, maxTokens: 4096 }
    )
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }

  try {
    const parsed = JSON.parse(result)
    const cards = (parsed.cards ?? [])
      .filter((c: { front?: string; back?: string }) => c.front && c.back)
      .map((c: { front: string; back: string; difficulty?: number }) => ({
        front: String(c.front).slice(0, 500),
        back: String(c.back).slice(0, 500),
        difficulty: [1, 2, 3, 4, 5].includes(c.difficulty ?? 3) ? c.difficulty ?? 3 : 3,
      }))
    return Response.json({ cards })
  } catch {
    return Response.json({ error: 'Invalid AI JSON' }, { status: 500 })
  }
}
