import { createAdminClient } from '@/lib/supabase/admin'
import { chatComplete } from '@/lib/openrouter'

/**
 * Cron endpoint — protected by CRON_SECRET header.
 * Aggregates each user's last 7-day stats and generates a coaching summary.
 * If RESEND_API_KEY is set, sends via Resend; otherwise just logs.
 */
export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, username, streak, quiz_correct, quiz_attempts, points_earned, xp')
    .not('username', 'is', null)
    .limit(500)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const sent: string[] = []
  for (const p of profiles ?? []) {
    const accuracy = p.quiz_attempts > 0 ? Math.round((p.quiz_correct / p.quiz_attempts) * 100) : 0
    let summary = ''
    try {
      summary = await chatComplete(
        [
          {
            role: 'system',
            content: 'You are a friendly study coach. Write a short, encouraging weekly email (5-7 sentences). ' +
              'Mention the user\'s streak, accuracy, and one specific suggestion. Sign as "Cardlet Coach".',
          },
          {
            role: 'user',
            content: `User: ${p.username}\nStreak: ${p.streak} days\nAccuracy: ${accuracy}%\nTotal points: ${p.points_earned ?? 0}\nXP: ${p.xp ?? 0}`,
          },
        ],
        { maxTokens: 400 }
      )
    } catch {
      continue
    }

    // Send via Resend if configured
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      // Need user email — fetch from auth.users
      const { data: { user } } = await admin.auth.admin.getUserById(p.id)
      if (user?.email) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Cardlet Coach <coach@cardlet.app>',
            to: user.email,
            subject: '📚 Your weekly Cardlet recap',
            text: summary,
          }),
        }).catch(() => {})
        sent.push(user.email)
      }
    }
  }

  return Response.json({ ok: true, sent: sent.length })
}
