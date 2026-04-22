import { createClient } from '@/lib/supabase/server'
import { chatStream } from '@/lib/openrouter'
import type { Message } from '@/lib/openrouter'

interface ChatBody {
  langName: string
  langCode: string
  unitTitle: string
  unitSubtitle: string
  vocab: { target: string; english: string }[]
  history: { role: 'user' | 'assistant'; content: string }[]
  brief?: boolean
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: ChatBody
  try {
    body = (await request.json()) as ChatBody
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { langName, unitTitle, unitSubtitle, vocab = [], history = [], brief = true } = body

  // Only keep the last 20 messages so the context stays focused and cheap.
  const trimmed = history.slice(-20).filter((m) => m.content.trim().length > 0)
  const vocabList = vocab.slice(0, 40)
    .map((p) => `- ${p.target} = ${p.english}`)
    .join('\n')

  const brevityInstruction = brief
    ? 'Keep responses to 2-3 sentences. Use emoji sparingly (never more than one per message).'
    : 'Responses may be longer but stay focused.'

  const messages: Message[] = [
    {
      role: 'system',
      content: `You are a friendly ${langName} conversation partner helping a beginner practice the "${unitTitle} — ${unitSubtitle}" unit.

RULES:
- Write primarily in ${langName}. If the student writes in English, reply with the ${langName} version first, then a quick (…English translation…) in parens.
- Prefer vocabulary the student has already seen from this unit:
${vocabList || '(no vocab provided — stay at beginner level)'}
- If the student uses incorrect grammar or spelling, gently correct them in a one-line aside like "→ small fix: X → Y".
- Keep the conversation natural and at A1 level. Ask short follow-up questions so the student keeps practicing.
- ${brevityInstruction}

Start the conversation if the history is empty.`,
    },
    ...trimmed,
  ]

  if (trimmed.length === 0) {
    messages.push({
      role: 'user',
      content: `Let's practice! Greet me in ${langName} and ask an easy opening question related to "${unitSubtitle.toLowerCase()}".`,
    })
  }

  const stream = await chatStream(messages)
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
