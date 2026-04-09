const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'
const MODEL = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini'
const MAX_TOKENS = Number(process.env.OPENROUTER_MAX_TOKENS ?? 1024)

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function getHeaders() {
  return {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
    'X-Title': 'Smart Stack',
  }
}

/**
 * Non-streaming completion. Returns the assistant message content as a string.
 * Pass jsonMode: true to request JSON output.
 */
export async function chatComplete(
  messages: Message[],
  opts: { jsonMode?: boolean; maxTokens?: number } = {}
): Promise<string> {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    max_tokens: opts.maxTokens ?? MAX_TOKENS,
    temperature: 0.7,
  }
  if (opts.jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data.choices[0].message.content as string
}

/**
 * Streaming completion. Returns a ReadableStream of SSE bytes.
 * The stream emits OpenRouter SSE chunks (data: {...}\n\n).
 * Pipe this directly into a Response for SSE endpoints.
 */
export async function chatStream(messages: Message[]): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      max_tokens: MAX_TOKENS,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${text}`)
  }

  if (!res.body) throw new Error('No response body from OpenRouter')

  // Transform the raw SSE from OpenRouter into plain text delta SSE for our clients
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  return new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
            break
          }
          const text = decoder.decode(value, { stream: true })
          // Parse each SSE line and re-emit just the text delta
          for (const line of text.split('\n')) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (raw === '[DONE]') continue
            try {
              const json = JSON.parse(raw)
              const delta = json.choices?.[0]?.delta?.content
              if (delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`))
              }
            } catch {
              // ignore malformed chunks
            }
          }
        }
      } catch (err) {
        controller.error(err)
      }
    },
  })
}
