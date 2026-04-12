import { createClient } from '@/lib/supabase/server'
import { chatComplete } from '@/lib/openrouter'

interface WrongCard {
  front: string
  back: string
  userAnswer?: string
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { wrong?: WrongCard[] }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const wrong = (body.wrong ?? []).slice(0, 20)
  if (wrong.length === 0) {
    return Response.json({ groups: [] })
  }

  const dump = wrong
    .map((c, i) => `${i + 1}. Q: ${c.front}\n   Correct: ${c.back}${c.userAnswer ? `\n   You said: ${c.userAnswer}` : ''}`)
    .join('\n')

  let result: string
  try {
    result = await chatComplete(
      [
        {
          role: 'system',
          content:
            'You are a study coach. Group these wrong answers by underlying concept (max 5 groups). ' +
            'For each group give a short, friendly explanation of the concept the user is missing. ' +
            'Return JSON: {"groups": [{"topic": "...", "cardIndices": [0, 2], "explanation": "..."}]}.',
        },
        { role: 'user', content: `Wrong answers:\n\n${dump}` },
      ],
      { jsonMode: true, maxTokens: 1500 }
    )
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }

  let parsed: { groups: unknown[] }
  try {
    parsed = JSON.parse(result)
  } catch {
    return Response.json({ error: 'Invalid AI JSON' }, { status: 500 })
  }
  return Response.json({ groups: parsed.groups ?? [] })
}
