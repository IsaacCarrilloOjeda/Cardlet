import { createClient } from '@/lib/supabase/server'
import { chatComplete } from '@/lib/openrouter'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { content?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { content } = body
  if (!content?.trim()) {
    return Response.json({ error: 'content required' }, { status: 400 })
  }

  let result: string
  try {
    result = await chatComplete(
      [
        {
          role: 'system',
          content:
            'You detect existing flashcard pairs in raw text. ' +
            'Look for patterns like "term: definition", "Q: ... A: ...", numbered lists, or bullet pairs. ' +
            'Do NOT generate new content — only extract pairs that already exist. ' +
            'Return JSON: {"cards": [{"front": "...", "back": "...", "difficulty": 3}]}. ' +
            'If no clear pairs are detected, return {"cards": []}.',
        },
        { role: 'user', content: `Extract pairs from:\n\n${content}` },
      ],
      { jsonMode: true }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Auto-split failed'
    return Response.json({ error: message }, { status: 500 })
  }

  let parsed: { cards: { front: string; back: string; difficulty?: number }[] }
  try {
    parsed = JSON.parse(result)
  } catch {
    return Response.json({ error: 'AI returned invalid JSON' }, { status: 500 })
  }

  const cards = (parsed.cards ?? [])
    .filter((c) => c.front && c.back)
    .map((c) => ({
      front: String(c.front).slice(0, 500),
      back: String(c.back).slice(0, 500),
      difficulty: 3,
    }))

  return Response.json({ cards })
}
