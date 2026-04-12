import { createClient } from '@/lib/supabase/server'
import { chatComplete } from '@/lib/openrouter'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { front?: string; back?: string; level?: 5 | 15 | 25 }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { front, back, level = 15 } = body
  if (!front || !back) return Response.json({ error: 'front and back required' }, { status: 400 })

  const audience =
    level === 5
      ? 'a curious 5-year-old. Use simple words, analogies, and short sentences.'
      : level === 15
      ? 'a curious 15-year-old high-school student. Use accurate but accessible language.'
      : 'a curious 25-year-old college graduate. Use precise, rigorous language.'

  let explanation: string
  try {
    explanation = await chatComplete(
      [
        {
          role: 'system',
          content: `You are explaining a flashcard concept to ${audience} Keep it under 4 sentences.`,
        },
        { role: 'user', content: `Concept: ${front}\nFact: ${back}` },
      ],
      { maxTokens: 350 }
    )
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }

  return Response.json({ explanation: explanation.trim(), level })
}
