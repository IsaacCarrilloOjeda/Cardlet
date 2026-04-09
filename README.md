# Smart Stack

A study platform that rivals Quizlet, with heavier AI integration.

## Features

- Auth: Supabase magic link + Google OAuth
- Study sets: CRUD with cards
- Flashcard study session with spaced repetition (SM-2 algorithm)
- Quiz modes: multiple choice, written, match game
- AI card generation from text/URL
- AI tutor for wrong answers
- Search across public study sets

## Tech Stack

- Next.js 14 (app router)
- Tailwind CSS
- Supabase (Postgres + Auth + Realtime + Storage)
- OpenRouter AI (Claude)
- Vercel deployment

## Setup

1. Clone the repo
2. Install dependencies: `npm install`
3. Set up Supabase project and run the migrations in `migrations/001_initial_schema.sql`
4. Configure environment variables in `.env.local`
5. Run the dev server: `npm run dev`

## Environment Variables

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- OPENROUTER_API_KEY
- NEXT_PUBLIC_SITE_URL
