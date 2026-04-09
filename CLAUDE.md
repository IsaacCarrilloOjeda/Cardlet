# Cardlet — CLAUDE.md

> Full architecture guide: `c:\Users\carro\CLAUDE.md` → "Quizlet Rival" section.

## AI Behavior Rules
- **Do all git/terminal work yourself** — never ask Isaac to run commands manually.
- **IT/troubleshooting tone:** treat Isaac like he's 8. One step at a time, wait for response before giving the next step.
- **Token efficiency:** use simple words, short sentences. Don't over-explain.

**Run:** `npm run dev` | **Live:** https://cardlet.app | **Repo:** IsaacCarrilloOjeda/Cardlet

**Stack:** Next.js 16.2.2, React 19, TypeScript, Tailwind CSS 4, Supabase, OpenRouter, Framer Motion

---

## CRITICAL: Next.js 16 Rules
- `params`, `searchParams`, `cookies()`, `headers()` are all **Promises** — always `await` them
- All dynamic route pages must be `async`
- Path alias: `@/*` → `./src/*`
- Architecture: Server Components fetch → pass props to `*Client.tsx`. Never fetch in Client Components except `/api/ai/*`
- All mutations go through `src/lib/actions.ts` — never call `src/lib/db.ts` writes directly

---

## Key Files
| File | Purpose |
|---|---|
| `src/types/index.ts` | All shared TS types |
| `src/lib/db.ts` | Supabase query helpers (server-only) |
| `src/lib/actions.ts` | All `'use server'` mutations |
| `src/lib/sm2.ts` | SM-2 spaced repetition algorithm |
| `src/lib/openrouter.ts` | OpenRouter/Claude API client |
| `src/lib/admin-auth.ts` | Admin cookie auth (not Supabase) |
| `src/lib/supabase/server.ts` | Server Supabase client |
| `src/lib/supabase/admin.ts` | Service-role client (bypasses RLS) |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/components/layout/CreditsContext.tsx` | Unified credit pool + constants |

---

## File Map

### app/ (routes)
- `page.tsx` — Dashboard (redirects to /login if unauthed)
- `layout.tsx` — Root layout: ThemeProvider, CreditsContext, Header, Footer
- `login/page.tsx` — Google OAuth + magic link login
- `explore/page.tsx` — Public sets (`?mode=sets`) or materials (`?mode=materials`)
- `profile/page.tsx` — User profile + stats
- `leaderboard/page.tsx` — Leaderboard
- `sets/[id]/page.tsx` — Set detail + card editor
- `study/[setId]/page.tsx` — Flashcard study session
- `quiz/[setId]/page.tsx` — Quiz mode (multiple choice, written, match)
- `admin/*` — Password-protected admin panel (cookie auth, not Supabase)
- `auth/callback/route.ts` — OAuth callback (exchanges code for session)
- `auth/signin/route.ts` — POST only; redirects to Google OAuth (uses 303, not 307)
- `auth/signout/route.ts` — Clears session
- `auth/magic-link/route.ts` — Sends magic link email
- `api/ai/generate-cards/route.ts` — POST `{content, count}` → `{cards}`
- `api/ai/distractors/route.ts` — POST `{correctAnswer, cardFront}` → `{options}`
- `api/ai/check-answer/route.ts` — POST `{question, correctAnswer, userAnswer}` → `{correct, explanation}`
- `api/ai/tutor/route.ts` — SSE stream; `halfPerformance=true` = 2-3 sentence cap

### src/components/
- `layout/` — Header, Footer, ThemeProvider, CreditsContext, BarProgress, CircleProgress, UserAvatar
- `dashboard/` — DashboardClient, StudySetCard, CreateSetModal
- `sets/` — SetDetailClient, CardList, CardPreview, CardForm, AIGenerateModal
- `study/` — StudySessionClient, CardFlip, ConfidenceButtons, ProgressBar, CompletionScreen, AITutorChat
- `quiz/` — QuizModeClient, QuizMultipleChoice, QuizWritten, QuizMatch, QuizTutorPanel
- `explore/` — ExploreClient
- `profile/` — ProfileClient
- `admin/` — AdminShell, AdminOverviewClient, AdminUsersClient, AdminSetsClient, AdminMaterialsClient, AdminFeedbackClient, AdminLoginClient

### migrations/
- `001_initial_schema.sql` — profiles, study_sets, cards, user_card_progress + RLS
- `002_admin_features.sql` — study_materials, feedback, admin_logs; `study_sets.user_id` nullable
- `003_leaderboard.sql` — materialized leaderboard view

---

## Credits System
Single pool in localStorage `ss_credits_v2`. Constants in `CreditsContext.tsx`:
- `TUTOR_FULL_COST` = 10, `TUTOR_HALF_COST` = 5, `WRITTEN_GRADING_COST` = 1, `CARD_GEN_COST` = 1
- Default: 100 credits. Bundle: +100.

---

## Admin Panel
- Route: `/admin` — cookie-based auth (`ADMIN_PASSWORD` env var), no Supabase auth
- Always use `createAdminClient()` for admin DB queries — never regular `createClient()`
- `study_sets.user_id` is nullable — admin-created sets have `user_id=null`

---

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # use https://cardlet.app in Vercel
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_MAX_TOKENS=1024
ADMIN_PASSWORD=
```

---

## Lessons Learned (AI traps)
- **`auth/signin` must use `303` redirect** — `NextResponse.redirect(url, { status: 303 })`. Using default 307 preserves POST method → Google rejects with 405.
- **`cost !== 1` type error** — `TUTOR_FULL_COST` and `TUTOR_HALF_COST` are `10 | 5`, never `1`. Don't write `cost !== 1` — TypeScript will fail the build. Just write `credits` or hardcode `'credits'`.
- **Never commit only boilerplate** — all real app folders (`app/auth/`, `app/api/`, `src/`) must be explicitly staged. `git add .` before first push.
- **Supabase + Google OAuth redirect URLs** must be updated whenever the domain changes (localhost → ngrok → production).
- **`createAdminClient()`** for all admin routes — regular client respects RLS and will silently return no data.
