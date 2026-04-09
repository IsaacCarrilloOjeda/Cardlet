import { createClient } from '@/lib/supabase/server'
import { chatComplete } from '@/lib/openrouter'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { correctAnswer: string; cardFront: string; existingAnswers?: string[] }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { correctAnswer, cardFront, existingAnswers = [] } = body

  const result = await chatComplete([
    {
      role: 'system',
      content: 'You generate plausible but incorrect answer options for flashcard multiple-choice questions. Return ONLY a valid JSON object: {"options": ["wrong1", "wrong2", "wrong3"]}. Make options realistic and similar in style to the correct answer but factually wrong.',
    },
    {
      role: 'user',
      content: `Question: "${cardFront}"\nCorrect answer: "${correctAnswer}"\n${existingAnswers.length > 0 ? `Other answers in this set: ${existingAnswers.slice(0, 5).join(', ')}\n` : ''}Generate 3 wrong answer options.`,
    },
  ], { jsonMode: true })

  let parsed: { options: string[] }
  try {
    parsed = JSON.parse(result)
    if (!Array.isArray(parsed.options)) throw new Error()
  } catch {
    return Response.json({ error: 'AI returned invalid response' }, { status: 500 })
  }

  return Response.json({ options: parsed.options.slice(0, 3) })
}
