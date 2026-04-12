# Cardlet

AI-powered flashcard study platform with spaced repetition, adaptive quizzes, and an on-demand AI tutor.

**Live at [cardlet.app](https://cardlet.app)**

---

## Features

### Study
- Flashcard sessions with **SM-2 spaced repetition** — cards resurface based on your recall history
- Confidence tracking: Know / Struggling / Unknown maps to SM-2 quality scores (5 / 3 / 1)
- **AI Tutor** — fires on missed cards, gives a targeted explanation in 2-3 sentences
- Text-to-speech playback on any card

### Card creation
- **AI generation** — paste text, a URL, or a topic and get cards back instantly
- **PDF import** — upload a PDF and generate cards from it
- **CSV import** — bulk import from a spreadsheet
- **Photo import** — snap or upload an image and extract card content
- Manual entry with live preview

### Quiz modes
- **Multiple choice** — AI-generated distractors per card
- **Written** — AI grades free-text answers with explanations
- **Match** — drag-and-drop pair matching
- In-quiz AI tutor available on wrong answers

### Platform
- Google OAuth + magic link auth (Supabase)
- Public study sets — browse, clone, and study sets from other users
- Leaderboard — ranked by study activity
- Daily challenge card
- Equation solver
- Credits system — governs AI feature usage
- PWA — installable, service worker included

### Admin dashboard (password-protected)
- User and study set management
- Upload study materials (PDF/doc), convert to public sets via AI
- Bug report and feature request inbox with status tracking

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + Framer Motion |
| Database + Auth | Supabase (Postgres, Auth, Storage) |
| AI | OpenRouter (configurable model) |
| PDF parsing | pdfjs-dist |
| Deploy | Vercel |

---

## Local setup

```bash
git clone https://github.com/IsaacCarrilloOjeda/Cardlet
cd Cardlet
npm install
```

Copy the environment template and fill in your credentials:

```bash
cp .env.example .env.local
```

Run the database migrations in your Supabase project (SQL editor or CLI), in order:

```
migrations/001_initial_schema.sql
migrations/002_admin_features.sql
migrations/003_leaderboard.sql
migrations/004_privacy_roles_accuracy.sql
migrations/005_indexes_and_streak.sql
migrations/006_points_xp_and_more.sql
```

Start the dev server:

```bash
npm run dev
```

---

## Environment variables

See `.env.example` for the full list. Required:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API |
| `OPENROUTER_API_KEY` | openrouter.ai/keys |
| `NEXT_PUBLIC_SITE_URL` | Your deployment URL (or `http://localhost:3000`) |
| `ADMIN_PASSWORD` | Pick anything — if unset, `/admin` is inaccessible |

---

## Architecture

Server Components fetch data from Supabase and pass it as props to `*Client.tsx` Client Components. AI calls are streaming-only and happen in API routes, never in Client Components.

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/page.tsx        # Login
│   └── auth/                 # Supabase auth callbacks (OAuth, magic link)
├── components/
│   ├── dashboard/            # Dashboard, set cards, daily challenge
│   ├── sets/                 # Set detail, card list, AI/CSV/PDF/photo import
│   ├── study/                # Study session, card flip, AI tutor, TTS
│   ├── quiz/                 # Multiple choice, written, match, quiz tutor
│   ├── explore/              # Public set browser
│   ├── leaderboard/          # Leaderboard
│   ├── profile/              # User profile
│   ├── solve/                # Equation solver
│   ├── admin/                # Admin dashboard (overview, users, sets, feedback, materials)
│   └── layout/               # Header, footer, theme, credits context
├── lib/
│   ├── db.ts                 # All Supabase query helpers (server-only)
│   ├── actions.ts            # All Server Actions — CRUD mutations + SM-2 updates
│   ├── sm2.ts                # SM-2 spaced repetition algorithm
│   ├── openrouter.ts         # chatComplete() and chatStream() wrappers
│   └── supabase/             # createClient (server, client, admin variants)
└── types/
    └── index.ts              # Shared TypeScript types
```

### AI routes

| Route | Input | Output |
|---|---|---|
| `POST /api/ai/generate-cards` | `{ content, count }` | `{ cards: [{ front, back, difficulty }] }` |
| `POST /api/ai/distractors` | `{ correctAnswer, cardFront }` | `{ options: string[] }` |
| `POST /api/ai/check-answer` | `{ question, correctAnswer, userAnswer }` | `{ correct, explanation }` |
| `POST /api/ai/tutor` | `{ cardFront, cardBack, wrongAnswer, history }` | SSE stream |

### SM-2 confidence mapping

| Response | SM-2 quality |
|---|---|
| Know | 5 |
| Struggling | 3 |
| Unknown | 1 |

---

## License

Cardlet is open source under [AGPL-3.0](./LICENSE).
The hosted version at cardlet.app is operated by [KYNE Systems](https://kynesystems.com).

If you deploy a modified version as a public service, AGPL requires you to publish your source changes under the same license.

---

Built by [KYNE Systems](https://kynesystems.com)
