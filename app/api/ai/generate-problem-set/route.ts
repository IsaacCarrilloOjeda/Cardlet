import { createClient } from '@/lib/supabase/server'
import { chatComplete } from '@/lib/openrouter'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { sourceText?: string; count?: number }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { sourceText, count = 10 } = body
  if (!sourceText?.trim()) {
    return Response.json({ error: 'sourceText required' }, { status: 400 })
  }

  const clamped = Math.min(Math.max(count, 1), 30)

  let result: string
  try {
    result = await chatComplete(
      [
        {
          role: 'system',
          content:
            'You are a problem-set author. Given example problems or notes, write NEW analogous practice problems ' +
            'that test the same concepts but with different numbers, names, or scenarios. ' +
            'Do NOT copy the originals. Each card front is a new problem; each back is the solution. ' +
            'Return ONLY valid JSON: {"cards": [{"front": "...", "back": "...", "difficulty": 3}]}. ' +
            'Difficulty 1-5; 3 = medium.',
        },
        {
          role: 'user',
          content: `Generate ${clamped} new analogous problems based on:\n\n${sourceText}`,
        },
      ],
      { jsonMode: true, maxTokens: 4096 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    return Response.json({ error: message }, { status: 500 })
  }

  let parsed: { cards: { front: string; back: string; difficulty: number }[] }
  try {
    parsed = JSON.parse(result)
    if (!Array.isArray(parsed.cards)) throw new Error('Invalid shape')
  } catch {
    return Response.json({ error: 'AI returned invalid JSON' }, { status: 500 })
  }

  const cards = parsed.cards
    .filter((c) => c.front && c.back)
    .map((c) => ({
      front: String(c.front).slice(0, 800),
      back: String(c.back).slice(0, 800),
      difficulty: [1, 2, 3, 4, 5].includes(c.difficulty) ? c.difficulty : 3,
    }))

  return Response.json({ cards })
}
