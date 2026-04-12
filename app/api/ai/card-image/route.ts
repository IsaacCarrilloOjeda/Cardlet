import { createClient } from '@/lib/supabase/server'

/**
 * Generate a small mnemonic image for a flashcard.
 * Uses Replicate Flux Schnell when REPLICATE_API_KEY is set;
 * otherwise falls back to a simple Unsplash search URL so the
 * UI still has something to display.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { front?: string; back?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { front, back } = body
  if (!front || !back) return Response.json({ error: 'front and back required' }, { status: 400 })

  const prompt = `Memorable, simple educational illustration of: ${front}. (${back}). Flat vector style, soft colors, centered, no text.`

  const apiKey = process.env.REPLICATE_API_KEY
  if (!apiKey) {
    // Fallback: deterministic Unsplash source URL (no API key required)
    const query = encodeURIComponent(front.split(/\s+/).slice(0, 4).join(' '))
    return Response.json({
      url: `https://source.unsplash.com/400x300/?${query}`,
      provider: 'unsplash-fallback',
    })
  }

  try {
    const res = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({
        input: { prompt, num_outputs: 1, output_format: 'webp', aspect_ratio: '1:1' },
      }),
    })
    const data = await res.json()
    const url = Array.isArray(data.output) ? data.output[0] : data.output
    if (!url) throw new Error('No output')
    return Response.json({ url, provider: 'replicate' })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
