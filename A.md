# Feature A: Languages Tab — 10 New Features (Phased)

> Handoff doc for another Claude Code session. Self-contained — read this, explore independently, then implement phase-by-phase. Don't ask clarifying questions unless something is truly ambiguous. Deploy after each phase per root [CLAUDE.md](../CLAUDE.md) Deployment Rule: `git commit` + `git push` + `vercel --prod`.

## Why

The Languages tab ([src/components/languages/LanguagePage.tsx](src/components/languages/LanguagePage.tsx)) is a Duolingo-style skill tree with lesson nodes, units, and basic XP. It's visually polished but shallow — you can burn through every lesson in under an hour and there's no reason to return. This doc adds 10 features that give it retention loops, real stakes, and tie it back into the rest of Cardlet (study sets, leaderboard, tutor).

## Current state (what's already wired)

- **Data model**: [src/components/languages/lessonData.ts](src/components/languages/lessonData.ts) — `LANGUAGES`, `ACHIEVEMENTS`, per-language `units[].lessons[].exercises[]`. All static TS, no DB.
- **Progress**: stored in `localStorage` under `cardlet-lang-progress-v1` as `Record<langId, { completedLessons, xp, streak }>`. Achievements under `cardlet-lang-achievements`.
- **Lesson runtime**: [src/components/languages/LessonModal.tsx](src/components/languages/LessonModal.tsx) — handles exercises, reports XP + perfect flag on completion.
- **Theming**: everything now routes through `var(--accent)` / `var(--accent-hover)` from [src/components/layout/ThemeProvider.tsx](src/components/layout/ThemeProvider.tsx). The user picks accent in the settings popover in [Header.tsx](src/components/layout/Header.tsx). **Do not hardcode hex colors for UI state — always `var(--accent)`.**
- **No emoji rule** (from user memory): use custom stroke-based SVG icons. Never use emoji in UI. Match the style in `LessonIcon` / `LockIcon` / `RatMascot` in LanguagePage.tsx.
- **Credits system**: unified pool in [src/components/layout/CreditsContext.tsx](src/components/layout/CreditsContext.tsx). Constants: `TUTOR_FULL_COST`, `TUTOR_HALF_COST`. Any AI call must deduct credits client-side before the fetch.
- **OpenRouter wrappers**: [src/lib/openrouter.ts](src/lib/openrouter.ts) — `chatComplete(messages, {jsonMode?})`, `chatStream(messages)`. Use these, not raw fetch.
- **Web Speech API** is already used for pronunciation (grep `SPEECH_LANG` in lessonData.ts). Voices in `es-ES`, `fr-FR`, `de-DE`, `ja-JP`, `ko-KR`, `zh-CN`, `pt-PT`, `it-IT`.

## Constraints that apply to every phase

1. Every UI color that signals progress / XP / completion / active state uses `var(--accent)`. Unit banners keep their per-unit color (those are decoration, not state).
2. No new DB tables in phases 1–2. Keep everything in localStorage. Only phase 3 touches Supabase.
3. Each feature gets its own file when over ~80 lines. Small helpers (<40 lines) can live inline in LanguagePage.tsx.
4. All AI calls cost credits — check the pool, deduct, show "Out of credits" state if insufficient.
5. Preserve Next.js 16 rules — `params`/`searchParams` are Promises, must `await`.

---

## Phase 1 — Retention loops (no schema changes, ~2–3 hrs)

### 1. Hearts / lives system

Duolingo-style: 5 hearts max, lose one on a wrong answer inside a lesson. At 0 hearts, the lesson fails — user closes the modal and has to wait (or pay credits) to retry. Refill 1 heart every 30 minutes up to 5.

- Store: `cardlet-lang-hearts` = `{ hearts: number, lastRefillAt: ISO }`. Compute current hearts on read: `min(5, stored + floor((now - lastRefillAt) / 30min))`.
- New component `src/components/languages/HeartsBar.tsx` — renders 5 heart SVGs (filled / empty), shown in `SkillTreeView` top bar next to XP chip.
- Wire into `LessonModal`: on wrong answer, decrement hearts. If hearts reach 0, close the modal with a "You ran out of hearts" screen that offers "Refill for 20 credits" or "Wait X min".
- `perfect` flag (already passed to `handleLessonComplete`) = true only if no hearts lost *in this lesson*.

### 2. Streak + daily XP goal bar

Two things, tightly linked — keep them in one feature:
- **Streak**: already partially tracked (`progress[lang].streak`) but never rendered. Move to a **global** streak (not per-language) under `cardlet-lang-streak` = `{ count, lastActivityDate: YYYY-MM-DD }`. Bump when XP is earned on a new day; reset to 1 if the gap > 1 day.
- **Daily goal**: user picks 10 / 20 / 50 XP/day (default 20). Store under `cardlet-lang-daily-goal`. Show a thin progress bar at the top of `SkillTreeView` with "12 / 20 XP today". Fills with `var(--accent)`. When it hits 100%, show a small celebration (framer-motion scale + fade).
- Flame icon (custom SVG, stroke style) next to streak count. Grey when inactive today, `var(--accent)` when active.

### 3. Audio-only exercise filter

Add a toggle in the skill tree top bar: "Audio mode" (headphones SVG). When on, `LessonModal` filters exercises to only those that have audio (listen + repeat, translate-from-audio). Hide typing/matching exercises.

- In lessonData.ts, tag exercise types that have audio support. Multiple-choice translate exercises with target-lang prompt work if we TTS the prompt.
- Persist toggle in `localStorage` as `cardlet-lang-audio-mode`.

---

## Phase 2 — Content depth (~3–4 hrs, still localStorage)

### 4. Real Daily Challenge (language version)

The dashboard already has [src/components/dashboard/DailyChallengeCard.tsx](src/components/dashboard/DailyChallengeCard.tsx) that picks one card from the user's sets. Build the language analog:

- One "bonus lesson" per day per user, surfaced at the top of the language picker (hero area). Rewards 2× XP.
- Selection: pick one *completed* lesson from the user's active language at random, seeded by the date so it's stable across refreshes. If the user has no completed lessons, pick the first available lesson (promoted to daily challenge as the "getting started" nudge).
- Store `cardlet-lang-daily-done-YYYY-MM-DD` = `true` once finished. Reset at local midnight.
- Use `var(--accent)` for the card border/glow, matching the existing daily challenge card style.

### 5. Checkpoint test between units

Currently Unit 2+ shows "Coming soon" when locked. Replace that with a **checkpoint** — a 10-question quiz pulling questions from all lessons in the completed unit. Passing (≥80%) unlocks the next unit. Failing keeps it locked; retry costs 1 heart.

- New component `src/components/languages/CheckpointModal.tsx`. Reuses exercise types from `lessonData.ts`.
- Unit lock logic moves from `unit.locked` static flag to a derived `isUnitComplete(unitId, progress) && passedCheckpoint(unitId)`.
- Store passed checkpoints: `cardlet-lang-checkpoints` = `{ [unitId]: passedAt }`.

### 6. Review weak words

A per-language auto-generated lesson of 10 words the user got wrong most. Replaces nothing — adds a button at the top of each language's skill tree: "Review weak words (12)" that opens a LessonModal with a generated exercise list.

- Tracking: on every wrong answer in LessonModal, log the `correctAnswer` (the target-language word) to `cardlet-lang-mistakes` = `Record<langId, Record<word, count>>`.
- The generator: sort by count desc, take top 10, build multipleChoice exercises with distractors from `DISTRACTORS[langId]`.
- On a correct answer during review, decrement count (min 0). When a word hits 0, remove it from the mistake map.

---

## Phase 3 — DB-backed + AI (~4–6 hrs, touches Supabase)

### 7. Language leaderboard

Cardlet already has a leaderboard feature (see memory `project_leaderboard_features.md`). Extend it for languages.

- New migration `008_language_xp.sql`: table `language_xp (user_id uuid, lang_id text, xp integer default 0, updated_at timestamptz, primary key (user_id, lang_id))`.
- Server action `updateLanguageXpAction(langId, xpDelta)` in [src/lib/actions.ts](src/lib/actions.ts) — upserts `language_xp` with `xp = xp + xpDelta`. Call from `handleLessonComplete` whenever the user is authed.
- New route `app/leaderboard/languages/page.tsx` — weekly XP ranking per language (tabs: Spanish / French / German). Filters: Friends only (existing friends system), Global.
- Respects the existing privacy toggle from memory: users opted out of leaderboard don't show up.
- Migrate existing localStorage XP to DB on first login via a one-shot effect in LanguagePage (key `cardlet-lang-migrated-v1`).

### 8. Export vocab to Cardlet flashcard sets

"Save this unit as a study set" button on each unit banner. Extracts all word pairs from the unit's `matchPairs` + `translate` exercises → creates a real `study_sets` row + `cards` rows via `createStudySetAction` + `bulkInsertCards`.

- Use existing [src/lib/actions.ts](src/lib/actions.ts) helpers — do not write a new code path for set creation.
- Auto-tag the set with the language name as a folder (e.g. "French Unit 1" in folder "French").
- If the user is a guest, prompt sign-in first.

### 9. AI conversation mode

For completed units only. Opens a chat where the user converses with an AI tutor *in the target language* about a topic relevant to the unit (greetings, food, family, etc.). AI grades grammar + vocab use at the end.

- New route `app/languages/[lang]/chat/[unitId]/page.tsx` → client component `LanguageChatClient`.
- System prompt: "You are a friendly $LANG tutor. Speak only in $LANG at CEFR A1–A2 level. Keep replies to 1–2 sentences. After 8 user turns, end the chat and output a JSON summary of mistakes and a 0–100 fluency score."
- Streaming via `chatStream()` from [src/lib/openrouter.ts](src/lib/openrouter.ts).
- Cost: `TUTOR_HALF_COST` (5 credits) per user turn — cheap enough to encourage use.
- On completion, award 50 XP (3× a normal lesson) as the reward for depth.

### 10. Language profile / skills dashboard

A new tab inside each language: "Stats". Shows:
- Time spent per unit (estimate from lesson completions × avg lesson duration)
- Strongest / weakest word categories (pulled from `cardlet-lang-mistakes`)
- XP history — simple bar chart, last 14 days. Reuse [src/components/profile/ActivityHeatmap.tsx](src/components/profile/ActivityHeatmap.tsx) pattern if it generalizes, otherwise a standalone component.
- Earned achievements grid (reuse the one in LanguagePage).
- Share button — canvas-to-image render of a stat card for social sharing (`html2canvas` already a dep in `rcconcrete-website`, but not here — either add it or use native canvas).

---

## Wrap-up per phase

After each phase:
1. Run `npm run build` locally to verify typecheck.
2. Manual smoke: start a lesson, finish it, confirm XP/streak/hearts reflect correctly.
3. `git add -A && git commit -m "feat(languages): <phase name>"` → `git push` → `vercel --prod`.
4. Update the feature list at the top of this file to strike through completed items.

## Anti-patterns — do NOT

- ❌ Don't import Framer Motion into new files unless animation is core to the feature — use CSS transitions where possible. The bundle is already heavy.
- ❌ Don't add a new localStorage key namespace — everything languages-related uses the `cardlet-lang-*` prefix.
- ❌ Don't rebuild the skill tree layout — the SNAKE offsets + unit banners are tuned. Extend, don't replace.
- ❌ Don't add per-language color preferences — the accent is global, set via ThemeProvider. Respect it.
- ❌ Don't write fake stats anywhere. If a count can't be computed from real data, don't show it.
