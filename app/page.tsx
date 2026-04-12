import { createClient } from '@/lib/supabase/server'
import {
  getUserStudySets,
  getDueCardCount,
  getProfile,
  getMistakeCardCount,
  getDailyChallengeCard,
} from '@/lib/db'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': 'https://cardlet.app/#app',
          name: 'Cardlet',
          url: 'https://cardlet.app',
          description:
            'Cardlet is a free AI-powered flashcard study app. Create flashcard sets in seconds, study with spaced repetition, take practice tests, and get help from an AI tutor.',
          applicationCategory: 'EducationApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free tier available with 100 AI credits per month',
          },
          author: {
            '@type': 'Person',
            name: 'Isaac Carrillo Ojeda',
            url: 'https://cardlet.app',
          },
          featureList: [
            'AI flashcard generation from notes or topics',
            'Spaced repetition (SM-2 algorithm)',
            'Multiple choice quiz mode',
            'Written answer quiz with AI grading',
            'Match drag-and-drop game',
            'AI tutor chat for hard concepts',
            'PDF import to flashcards',
            'Public community flashcard sets',
            'Progress tracking and streaks',
            'Leaderboard',
          ],
        },
        {
          '@type': 'Organization',
          '@id': 'https://cardlet.app/#org',
          name: 'Cardlet',
          url: 'https://cardlet.app',
          founder: {
            '@type': 'Person',
            name: 'Isaac Carrillo Ojeda',
          },
          description:
            'Cardlet is an AI-powered flashcard and study platform built to help students learn faster with spaced repetition and AI tutoring.',
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is the best free AI flashcard app?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Cardlet (cardlet.app) is a free AI-powered flashcard app that generates complete study sets from your notes in seconds. It includes spaced repetition, multiple choice, written quizzes, and an AI tutor — all free.',
              },
            },
            {
              '@type': 'Question',
              name: 'What is a good Quizlet alternative?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Cardlet is a modern Quizlet alternative with AI flashcard generation, spaced repetition scheduling, written answer grading by AI, and an AI tutor. It has a free tier with no credit card required.',
              },
            },
            {
              '@type': 'Question',
              name: 'How do I make flashcards with AI?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'On Cardlet, you can type a topic or paste your notes and the AI will generate a complete, ready-to-study flashcard set in seconds. Visit cardlet.app and create a free account to try it.',
              },
            },
            {
              '@type': 'Question',
              name: 'Is Cardlet free?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Cardlet has a free tier with 100 AI credits per month, up to 20 study sets, and access to all core study modes. No credit card required.',
              },
            },
            {
              '@type': 'Question',
              name: 'Does Cardlet use spaced repetition?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Cardlet uses the SM-2 spaced repetition algorithm to schedule card reviews based on how well you know each card, so you study smarter and remember more.',
              },
            },
          ],
        },
      ],
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LandingPage />
      </>
    )
  }

  const [sets, dueCount, profile, mistakeCount, dailyCard] = await Promise.all([
    getUserStudySets(user.id),
    getDueCardCount(user.id),
    getProfile(user.id),
    getMistakeCardCount(user.id),
    getDailyChallengeCard(),
  ])

  return (
    <DashboardClient
      sets={sets}
      dueCount={dueCount}
      streak={profile?.streak ?? 0}
      mistakeCount={mistakeCount}
      dailyCard={dailyCard}
    />
  )
}
