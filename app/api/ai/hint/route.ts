import { createClient } from '@/lib/supabase/server'
import { chatComplete } from '@/lib/openrouter'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { question?: string; answer?: string; level?: 1 | 2 | 3 }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { question, answer, level = 1 } = body
  if (!question || !answer) {
    return Response.json({ error: 'question and answer required' }, { status: 400 })
  }

  const tier =
    level === 1
      ? 'Give a VAGUE nudge — point at the topic without revealing anything specific. One sentence.'
      : level === 2
      ? 'Give a more SPECIFIC clue — narrow down the approach but do not state the answer. One or two sentences.'
      : 'Give an ALMOST-answer hint — describe what the answer involves in plain words but stop just short of saying it. Two sentences max.'

  let hint: string
  try {
    hint = await chatComplete(
      [
        {
          role: 'system',
          content: 'You are a study hint coach. Never reveal the full answer. ' + tier,
        },
        {
          role: 'user',
          content: `Question: ${question}\nAnswer (do NOT reveal): ${answer}\n\nGive a tier-${level} hint.`,
        },
      ],
      { maxTokens: 200 }
    )
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }

  return Response.json({ hint: hint.trim(), level })
}
