import { createClient } from '@/lib/supabase/server'
import { chatComplete } from '@/lib/openrouter'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { front?: string; back?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { front, back } = body
  if (!front || !back) return Response.json({ error: 'front and back required' }, { status: 400 })

  let result: string
  try {
    result = await chatComplete(
      [
        {
          role: 'system',
          content:
            'You rewrite flashcards to be clearer, shorter, and less ambiguous. ' +
            'Keep the same meaning. Return JSON: {"front": "...", "back": "..."}',
        },
        { role: 'user', content: `Front: ${front}\nBack: ${back}` },
      ],
      { jsonMode: true, maxTokens: 400 }
    )
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }

  try {
    const parsed = JSON.parse(result)
    return Response.json({ front: parsed.front ?? front, back: parsed.back ?? back })
  } catch {
    return Response.json({ error: 'Invalid AI JSON' }, { status: 500 })
  }
}
