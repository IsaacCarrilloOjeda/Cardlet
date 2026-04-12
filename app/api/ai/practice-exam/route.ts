import { createClient } from '@/lib/supabase/server'
import { chatComplete } from '@/lib/openrouter'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { setId?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { setId } = body
  if (!setId) return Response.json({ error: 'setId required' }, { status: 400 })

  // Pull cards
  const { data: cards, error } = await supabase
    .from('cards')
    .select('front, back')
    .eq('set_id', setId)
    .limit(40)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!cards || cards.length === 0) {
    return Response.json({ error: 'No cards in set' }, { status: 400 })
  }

  const sample = cards
    .slice(0, 30)
    .map((c, i) => `${i + 1}. Q: ${c.front}\n   A: ${c.back}`)
    .join('\n')

  let result: string
  try {
    result = await chatComplete(
      [
        {
          role: 'system',
          content:
            'You are an exam writer. Build a 10-question mixed practice exam from the provided cards. ' +
            'Use a mix of multiple-choice (4 options), written, and true/false. ' +
            'Return JSON: {"questions": [{"type": "mc"|"written"|"tf", "question": "...", "options": [...], "answer": "...", "topic": "..."}]}. ' +
            'Each question must have a topic label so weak areas can be identified later.',
        },
        { role: 'user', content: `Build the exam from these cards:\n\n${sample}` },
      ],
      { jsonMode: true, maxTokens: 3072 }
    )
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }

  let parsed: { questions: unknown[] }
  try {
    parsed = JSON.parse(result)
  } catch {
    return Response.json({ error: 'Invalid AI JSON' }, { status: 500 })
  }
  return Response.json({ questions: parsed.questions ?? [] })
}
