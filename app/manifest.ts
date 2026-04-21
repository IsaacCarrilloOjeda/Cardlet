import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cardlet — AI Flashcards',
    short_name: 'Cardlet',
    description: 'Study smarter with AI-powered flashcards, spaced repetition, and quizzes.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0d0f1a',
    theme_color: '#4255ff',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
