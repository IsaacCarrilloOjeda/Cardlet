import { createClient } from '@/lib/supabase/server'
import { chatComplete } from '@/lib/openrouter'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { equation?: string; imageBase64?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { equation, imageBase64 } = body
  if (!equation && !imageBase64) {
    return Response.json({ error: 'equation or imageBase64 required' }, { status: 400 })
  }

  const userContent = imageBase64
    ? [
        { type: 'text' as const, text: 'Solve the equation in this image step-by-step.' },
        { type: 'image_url' as const, image_url: { url: imageBase64 } },
      ]
    : `Solve step-by-step:\n\n${equation}`

  let result: string
  try {
    result = await chatComplete(
      [
        {
          role: 'system',
          content:
            'You are a math tutor. Solve problems step-by-step. ' +
            'Render equations as LaTeX between $...$ for inline and $$...$$ for display. ' +
            'Number each step. End with a clear "Answer:" line.',
        },
        { role: 'user', content: userContent },
      ],
      { maxTokens: 1500 }
    )
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }

  return Response.json({ steps: result.trim() })
}
