import { isAdminAuthenticated } from '@/lib/admin-auth'
import { chatComplete } from '@/lib/openrouter'

export const maxDuration = 60

export interface ScanResult {
  text: string
  contentType: 'textbook' | 'notes' | 'exam' | 'equations' | 'reference' | 'general'
  summary: string
  wordCount: number
  suggestedActions: SuggestedAction[]
}

export interface SuggestedAction {
  action: 'flashcards' | 'outline' | 'summary' | 'sections'
  label: string
  description: string
  recommended: boolean
}

/**
 * AI 1 — Document Scanner
 * Accepts pre-extracted text (from PDF/TXT) OR a base64 image (for OCR).
 * Returns classified content + suggested actions for AI 2.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { text?: string; imageBase64?: string; mimeType?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { text, imageBase64, mimeType } = body

  let extractedText: string

  if (imageBase64) {
    // OCR the image first, then classify
    const dataUrl = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:${mimeType ?? 'image/jpeg'};base64,${imageBase64}`

    try {
      extractedText = await chatComplete(
        [
          {
            role: 'system',
            content:
              'You are an expert document OCR system. Extract ALL text from this document image accurately. ' +
              'Preserve structure (headings, bullets, numbered lists, tables, paragraphs). ' +
              'Render equations as LaTeX between $...$ (inline) and $$...$$ (display). ' +
              'Return ONLY the transcription — no preamble, no commentary.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract all text from this document:' },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
        { maxTokens: 4000 }
      )
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : 'OCR failed' },
        { status: 500 }
      )
    }
  } else if (text?.trim()) {
    extractedText = text
  } else {
    return Response.json({ error: 'text or imageBase64 required' }, { status: 400 })
  }

  // AI 1 analysis: classify + suggest actions
  const analysisPrompt = `Analyze this educational content and return a JSON object.

Content (first 8000 chars):
${extractedText.slice(0, 8000)}

Return ONLY this JSON:
{
  "contentType": "textbook" | "notes" | "exam" | "equations" | "reference" | "general",
  "summary": "2-3 sentence description of what this content is about",
  "wordCount": <approximate integer>,
  "suggestedActions": [
    {
      "action": "flashcards" | "outline" | "summary" | "sections",
      "label": "short button label",
      "description": "one line: what this will create",
      "recommended": true | false
    }
  ]
}

Rules for suggestedActions (2-4 items, exactly one recommended: true):
- Dense definitions/facts → recommend "flashcards"
- Long structured content (multiple chapters/topics) → recommend "sections"
- Narrative or reference material → recommend "summary"
- Outlines/notes → recommend "outline"
- Always include "flashcards" as an option
- wordCount = approximate word count of the extracted text`

  try {
    const analysis = await chatComplete(
      [{ role: 'user', content: analysisPrompt }],
      { jsonMode: true, maxTokens: 800 }
    )

    const parsed = JSON.parse(analysis)

    return Response.json({
      text: extractedText,
      contentType: parsed.contentType ?? 'general',
      summary: parsed.summary ?? '',
      wordCount: parsed.wordCount ?? extractedText.split(/\s+/).filter(Boolean).length,
      suggestedActions: Array.isArray(parsed.suggestedActions)
        ? parsed.suggestedActions
        : defaultActions(),
    } satisfies ScanResult)
  } catch {
    return Response.json({
      text: extractedText,
      contentType: 'general',
      summary: `${extractedText.split(/\s+/).filter(Boolean).length} words extracted.`,
      wordCount: extractedText.split(/\s+/).filter(Boolean).length,
      suggestedActions: defaultActions(),
    } satisfies ScanResult)
  }
}

function defaultActions(): SuggestedAction[] {
  return [
    {
      action: 'flashcards',
      label: 'Generate Flashcards',
      description: 'Create a study set from key concepts',
      recommended: true,
    },
    {
      action: 'summary',
      label: 'Summarize',
      description: 'Create a condensed summary document',
      recommended: false,
    },
    {
      action: 'outline',
      label: 'Create Outline',
      description: 'Build a structured hierarchical outline',
      recommended: false,
    },
  ]
}
