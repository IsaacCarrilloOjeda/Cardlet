import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getMistakeCards } from '@/lib/db'
import { StudySessionClient } from '@/components/study/StudySessionClient'

export default async function MistakesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cards = await getMistakeCards(user.id)

  if (cards.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-5xl mb-4">✨</p>
        <h1 className="text-2xl font-bold mb-2">No mistakes yet</h1>
        <p className="text-[var(--muted)] mb-6">
          Cards you struggle with will show up here automatically.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <StudySessionClient
      cards={cards}
      setId="mistakes"
      setTitle="🎯 Mistake Deck"
      backHref="/"
    />
  )
}
