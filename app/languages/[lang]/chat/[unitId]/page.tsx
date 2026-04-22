import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LANGUAGES } from '@/components/languages/lessonData'
import { extractUnitVocab } from '@/components/languages/vocab'
import { LangChatClient } from '@/components/languages/LangChatClient'

interface PageProps {
  params: Promise<{ lang: string; unitId: string }>
}

export default async function LanguageChatPage({ params }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { lang, unitId } = await params
  const language = LANGUAGES.find((l) => l.id === lang && l.available)
  if (!language) notFound()
  const unit = language.units.find((u) => u.id === unitId)
  if (!unit || unit.locked) notFound()

  const vocab = extractUnitVocab(unit)

  return (
    <LangChatClient
      langName={language.name}
      langCode={language.id}
      langColor={language.color}
      unitId={unit.id}
      unitTitle={unit.title}
      unitSubtitle={unit.subtitle}
      vocab={vocab}
    />
  )
}
