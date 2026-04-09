import { createClient } from '@/lib/supabase/server'
import { chatStream } from '@/lib/openrouter'
import type { Message } from '@/lib/openrouter'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    cardFront: string
    cardBack: string
    wrongAnswer?: string
    history?: { role: 'user' | 'assistant'; content: string }[]
    halfPerformance?: boolean
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { cardFront, cardBack, wrongAnswer, history = [], halfPerformance = false } = body

  const brevityInstruction = halfPerformance
    ? 'Keep every response to 2-3 sentences maximum. This is a quick check-in — be concise and direct.'
    : 'Keep responses brief (2-4 sentences unless more detail is clearly needed).'

  const messages: Message[] = [
    {
      role: 'system',
      content: `You are a helpful, encouraging study tutor. A student is reviewing a flashcard and needs help understanding it.

Card front (question): "${cardFront}"
Card back (correct answer): "${cardBack}"
${wrongAnswer ? `Student's wrong answer: "${wrongAnswer}"` : ''}

Help the student understand the concept. Be concise and clear. Give mnemonics, examples, or analogies to help them remember. Ask follow-up questions to check understanding. ${brevityInstruction}`,
    },
    ...history,
    ...(history.length === 0 ? [{
      role: 'user' as const,
      content: wrongAnswer
        ? `I answered "${wrongAnswer}" but the correct answer is "${cardBack}". Can you help me understand why and how to remember it?`
        : `Can you help me understand: ${cardFront}`,
    }] : []),
  ]

  const stream = await chatStream(messages)

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
