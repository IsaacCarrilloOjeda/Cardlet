import { createClient } from '@/lib/supabase/server'
import { chatComplete } from '@/lib/openrouter'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { imageBase64?: string; mimeType?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { imageBase64, mimeType = 'image/jpeg' } = body
  if (!imageBase64) {
    return Response.json({ error: 'imageBase64 required' }, { status: 400 })
  }

  // Strip optional data URL prefix
  const cleaned = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:${mimeType};base64,${imageBase64}`

  let text: string
  try {
    text = await chatComplete(
      [
        {
          role: 'system',
          content:
            'You are an OCR assistant. Transcribe the text in the image accurately. ' +
            'Preserve structure (headings, bullets, numbered lists, paragraphs). ' +
            'Render math equations as LaTeX between $...$ for inline and $$...$$ for display. ' +
            'If the image contains handwriting, transcribe it faithfully. ' +
            'Return ONLY the transcription as Markdown — no preamble, no commentary.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Transcribe everything in this image:' },
            { type: 'image_url', image_url: { url: cleaned } },
          ],
        },
      ],
      { maxTokens: 2048 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transcription failed'
    return Response.json({ error: message }, { status: 500 })
  }

  // Heuristic: detect equation-heavy vs text
  const equationHits = (text.match(/\$[^$]+\$|\$\$[^$]+\$\$/g) ?? []).length
  const wordCount = text.split(/\s+/).filter(Boolean).length
  let kind: 'text' | 'equation' | 'mixed' = 'text'
  if (equationHits > 0 && wordCount < 30) kind = 'equation'
  else if (equationHits > 0) kind = 'mixed'

  return Response.json({ text: text.trim(), kind })
}
