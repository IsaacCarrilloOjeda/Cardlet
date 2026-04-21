# Feature A: Guest Study Mode (No-Account)

> Handoff doc for a Claude Code session. Self-contained — read this, do independent exploration, then implement. Don't ask clarifying questions unless something is genuinely ambiguous.

## Why

Cardlet currently requires sign-in to study a set. On school-managed Chromebooks, some districts block *all* third-party sign-in (Google OAuth + our magic-link emails both fail). Teachers who share a Cardlet set with their class hit a wall: students can view the set but can't study it. We need a no-account path so a share link is always usable.

Scope: read-only study. No spaced repetition, no progress tracking, no AI tutor credits, no stats. Just shuffle through cards, self-grade in your head, next card.

## Current state

- [app/study/[setId]/page.tsx](app/study/[setId]/page.tsx) redirects unauthed users to `/login`.
- [src/components/sets/SetDetailClient.tsx](src/components/sets/SetDetailClient.tsx) already detects guests via `isGuest` and renders a "Sign in to Study" button — this is the gate to replace.
- [src/components/study/StudySessionClient.tsx](src/components/study/StudySessionClient.tsx) already has a **cram mode** that skips SM-2 persistence (lines ~115–119). This is the primitive to lean on for guest mode — same pattern, just forced on.
- The SM-2 write path is `updateCardProgressAction(cardId, quality)` from `@/lib/actions` — requires authed user. Must be short-circuited for guests.
- AI tutor chat (`AITutorChat.tsx`) consumes credits — guest mode must hide/disable it (no localStorage writes for anon users, no credits to burn).

## What to build

### 1. New route: `/study/[setId]/guest/page.tsx`

Mirror the authed version but:
- Do **not** redirect unauthed users.
- Require `set.is_public === true` — 404 otherwise (private sets stay private).
- If a user IS signed in and lands here, redirect to `/study/[setId]` (the real authed route) so they don't lose their SM-2 progress silently.
- Fetch cards via a new helper `getPublicSetCards(setId)` in `src/lib/db.ts` (no user filtering, just all cards in the set). Add this helper.
- Render `<StudySessionClient cards={cards} setId={setId} setTitle={set.title} guestMode />`.

### 2. Add `guestMode` prop to `StudySessionClient`

- Force `cramMode=true` internally (no SM-2 writes) and hide the cram toggle (they're in guest mode, the toggle is meaningless).
- Hide the AI Tutor button / chat entirely when `guestMode`.
- Hide the Pomodoro timer if it writes to any user-scoped storage (check before hiding — it may be localStorage-only, in which case keep it).
- The completion screen's "View stats" / "Study again" buttons should remain; "View stats" should link to `/sets/{setId}` (the set page) instead of `/profile`.
- Add a small persistent banner: "Guest mode — sign in to track progress" with a link to `/login`.

### 3. Wire the guest entry point

In [src/components/sets/SetDetailClient.tsx](src/components/sets/SetDetailClient.tsx), the guest branch currently shows a single "Sign in to Study" button. Replace with TWO buttons side-by-side when `set.is_public`:
- **Primary** (accent color): `Study as guest` → `/study/{set.id}/guest`
- **Secondary** (outline): `Sign in to track progress` → `/login`

If the set is private, keep the current "Sign in to Study" behavior — guests can't see private sets anyway.

### 4. SEO/metadata

Public study sets already have `generateMetadata` on `/sets/[id]`. The `/study/[setId]/guest` route should add its own `generateMetadata` so shared links render nicely in Google Classroom / iMessage / Discord previews. Use the set title + `Study {title} — free flashcards on Cardlet`.

## Files you'll touch

- **New:** `app/study/[setId]/guest/page.tsx`
- **Edit:** `src/components/study/StudySessionClient.tsx` (add `guestMode` prop, gate SM-2 writes, hide tutor/stats)
- **Edit:** `src/components/sets/SetDetailClient.tsx` (replace guest gate with two-button guest-or-signin layout)
- **Edit:** `src/lib/db.ts` (add `getPublicSetCards(setId)`)
- **Possibly edit:** `src/components/study/CompletionScreen.tsx` (accept `guestMode` prop, adjust post-study links)

## Guardrails (don't violate these)

- **No writes to Supabase for anon users** — any Server Action call from the guest session will throw since RLS blocks anon inserts. Short-circuit at the client before calling, don't rely on RLS to reject.
- **Don't let authed users accidentally study a set via the guest route and lose SM-2 updates.** Hence the redirect-if-authed in the guest page.
- **No emoji in new UI** — use custom stroke SVGs. See other recent components for the style.
- **Keep private sets private.** Guest route must 404 on private sets, even if the setId is known.
- **Follow Next.js 16 rules:** `params` is `Promise<{...}>` and must be `await`-ed.

## Verification

1. Sign out. Visit a public set, click "Study as guest". Verify study session loads with no redirect to `/login`.
2. During study, tap "Know" / "Struggling" / "Don't Know" for a few cards. Sign in → check that your SM-2 review queue is **unchanged** (guest session wrote nothing).
3. Visit `/study/{public-set-id}/guest` while signed in → should redirect to `/study/{public-set-id}` (authed).
4. Visit `/study/{private-set-id}/guest` → 404.
5. Click "Share to Classroom" on a public set from an incognito window — open the shared link, verify a student can immediately study without sign-in.

## Deploy (per [C:\Users\carro\CLAUDE.md](C:/Users/carro/CLAUDE.md) rule)

After implementation: `git add` → `git commit` → `git push` → `vercel --prod`. No confirmation needed.
