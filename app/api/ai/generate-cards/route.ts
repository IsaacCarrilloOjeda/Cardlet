import { createClient } from '@/lib/supabase/server'
import { chatComplete } from '@/lib/openrouter'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { content: string; count?: number }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { content, count = 10 } = body
  if (!content?.trim()) {
    return Response.json({ error: 'content is required' }, { status: 400 })
  }

  const clampedCount = Math.min(Math.max(count, 1), 30)

  let result: string
  try {
    result = await chatComplete(
      [
        {
          role: 'system',
          content: `You are a flashcard generation expert. Extract key concepts from the provided text and create clear, concise flashcards. Return ONLY a valid JSON object in this exact format: {"cards": [{"front": "question or term", "back": "answer or definition", "difficulty": 3}]}. Difficulty is 1 (easy), 3 (medium), or 5 (hard).`,
        },
        {
          role: 'user',
          content: `Create ${clampedCount} flashcards from this content:\n\n${content}`,
        },
      ],
      { jsonMode: true }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OpenRouter request failed'
    return Response.json({ error: message }, { status: 500 })
  }

  let parsed: { cards: { front: string; back: string; difficulty: number }[] }
  try {
    parsed = JSON.parse(result)
    if (!Array.isArray(parsed.cards)) throw new Error('Invalid shape')
  } catch {
    const trimmed = result.trim()
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start !== -1 && end !== -1 && end > start) {
      try {
        parsed = JSON.parse(trimmed.slice(start, end + 1))
        if (!Array.isArray(parsed.cards)) throw new Error('Invalid shape')
      } catch {
        return Response.json({ error: 'AI returned invalid JSON response' }, { status: 500 })
      }
    } else {
      return Response.json({ error: 'AI returned invalid JSON response' }, { status: 500 })
    }
  }

  // Validate and clamp each card
  const cards = parsed.cards
    .filter((c) => c.front && c.back)
    .map((c) => ({
      front: String(c.front).slice(0, 500),
      back: String(c.back).slice(0, 500),
      difficulty: [1, 2, 3, 4, 5].includes(c.difficulty) ? c.difficulty : 3,
    }))

  return Response.json({ cards })
}
