# Smart Stack — CLAUDE.md

See `c:\Users\carro\CLAUDE.md` → "Smart Stack" section for the full architecture guide.

## Quick Reference

**Run:** `npm run dev`

**Stack:** Next.js 16.2.2, React 19, TypeScript, Tailwind CSS 4, Supabase, OpenRouter (Claude), Framer Motion

### CRITICAL: Next.js 16 Breaking Changes
- `params` and `searchParams` are `Promise<{...}>` — **must `await` them**
- `cookies()` and `headers()` **must be `await`-ed**
- All dynamic route pages must be `async`
- Read `node_modules/next/dist/docs/` for full details before writing new code

### Path Aliases
- `@/*` → `./src/*`

### Key Files
| File | Purpose |
|---|---|
| `src/types/index.ts` | Shared TypeScript types |
| `src/lib/db.ts` | Supabase query helpers (server-only) |
| `src/lib/actions.ts` | `'use server'` Server Actions |
| `src/lib/sm2.ts` | SM-2 spaced repetition algorithm |
| `src/lib/openrouter.ts` | OpenRouter/Claude API client |
| `src/lib/supabase/server.ts` | Server Supabase client |
| `src/lib/supabase/client.ts` | Browser Supabase client |

### Architecture Rule
Server Components fetch data → pass as props to `*Client.tsx` Client Components.
Never fetch data from Client Components (except `/api/ai/*` routes for streaming).

### All mutations go through `src/lib/actions.ts`
Never call `src/lib/db.ts` write functions directly from components — always go through a Server Action.

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENROUTER_API_KEY=   # server-only, no NEXT_PUBLIC_ prefix
```
