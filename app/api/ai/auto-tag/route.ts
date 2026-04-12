import { createClient } from '@/lib/supabase/server'
import { chatComplete } from '@/lib/openrouter'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Pull all untagged sets owned by the user
  const { data: sets, error } = await supabase
    .from('study_sets')
    .select('id, title, description')
    .eq('user_id', user.id)
    .is('subject', null)
    .limit(50)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!sets || sets.length === 0) return Response.json({ suggestions: [] })

  const list = sets.map((s) => `${s.id} | ${s.title}${s.description ? ' — ' + s.description : ''}`).join('\n')

  let result: string
  try {
    result = await chatComplete(
      [
        {
          role: 'system',
          content:
            'You suggest a single subject/folder name for each set. ' +
            'Use common school subjects (e.g., Biology, History, Spanish). ' +
            'Return JSON: {"suggestions": [{"id": "<set id>", "subject": "..."}]}.',
        },
        { role: 'user', content: list },
      ],
      { jsonMode: true, maxTokens: 1500 }
    )
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }

  try {
    const parsed = JSON.parse(result)
    return Response.json({ suggestions: parsed.suggestions ?? [] })
  } catch {
    return Response.json({ error: 'Invalid AI JSON' }, { status: 500 })
  }
}
