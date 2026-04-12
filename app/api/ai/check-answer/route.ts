import { createClient } from '@/lib/supabase/server'
import { chatComplete } from '@/lib/openrouter'
import type { GraderDifficulty } from '@/types'

const RUBRICS: Record<GraderDifficulty, string> = {
  easy:
    'Be VERY generous. Accept synonyms, paraphrases, partial phrasings, and minor spelling errors. ' +
    "If the student demonstrates ANY understanding, score 7+. Only give below 5 if completely wrong or off-topic.",
  normal:
    'Be reasonably generous with partial credit and synonyms. ' +
    'Scores: 1-3 = wrong/missing concept, 4-6 = partial understanding/minor errors, 7-9 = mostly correct, 10 = perfect.',
  hard:
    'Be strict. Require precise terminology, complete reasoning, and correct spelling of key terms. ' +
    'Partial answers max out at 5. A 7 requires the answer be substantially correct with only minor flaws.',
  brutal:
    'Be EXTREMELY strict — grade like a tough professor. Demand near-exact wording of key concepts. ' +
    'Penalize any vague language, hedging, or missing nuance. A 7 requires near-perfect reasoning AND wording. ' +
    'Anything less than complete and precise gets 5 or below.',
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    question: string
    correctAnswer: string
    userAnswer: string
    difficulty?: GraderDifficulty
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { question, correctAnswer, userAnswer, difficulty = 'normal' } = body
  const rubric = RUBRICS[difficulty] ?? RUBRICS.normal

  const result = await chatComplete([
    {
      role: 'system',
      content:
        `You evaluate student flashcard answers and assign a score from 1-10. ${rubric} ` +
        'Return ONLY valid JSON: {"score": <integer 1-10>, "explanation": "brief feedback"}.',
    },
    {
      role: 'user',
      content: `Question: "${question}"\nCorrect answer: "${correctAnswer}"\nStudent answered: "${userAnswer}"\n\nGrading mode: ${difficulty}\nScore this answer 1-10 and explain.`,
    },
  ], { jsonMode: true })

  let parsed: { score: number; explanation: string }
  try {
    parsed = JSON.parse(result)
    if (typeof parsed.score !== 'number' || parsed.score < 1 || parsed.score > 10) throw new Error()
  } catch {
    return Response.json({ error: 'AI returned invalid response' }, { status: 500 })
  }

  return Response.json({ ...parsed, difficulty })
}
