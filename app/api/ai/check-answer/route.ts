import { createClient } from '@/lib/supabase/server'
import { chatComplete } from '@/lib/openrouter'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { question: string; correctAnswer: string; userAnswer: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { question, correctAnswer, userAnswer } = body

  const result = await chatComplete([
    {
      role: 'system',
      content: 'You evaluate student flashcard answers and assign a score from 1-10. Be generous with partial credit and synonyms. Return ONLY valid JSON: {"score": <integer 1-10>, "explanation": "brief feedback"}. Scores: 1-3 = wrong/missing concept, 4-6 = partial understanding/minor errors, 7-9 = mostly correct with minor issues, 10 = perfect or excellent answer.',
    },
    {
      role: 'user',
      content: `Question: "${question}"\nCorrect answer: "${correctAnswer}"\nStudent answered: "${userAnswer}"\n\nScore this answer 1-10 and explain.`,
    },
  ], { jsonMode: true })

  let parsed: { score: number; explanation: string }
  try {
    parsed = JSON.parse(result)
    if (typeof parsed.score !== 'number' || parsed.score < 1 || parsed.score > 10) throw new Error()
  } catch {
    return Response.json({ error: 'AI returned invalid response' }, { status: 500 })
  }

  return Response.json(parsed)
}
