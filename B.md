# Feature B: Offline PWA + Quizlet Import + Printable Flashcards

> Handoff doc for a Claude Code session. Three related school-value features bundled because they're all small, independent, and share review context. Implement in any order. Self-contained — read this, explore, then implement.

## Why (per feature)

1. **Offline PWA** — school wifi is flaky; students should be able to install Cardlet on a Chromebook home screen and keep studying when the network drops during bus rides or after school.
2. **Quizlet import** — Quizlet started paywalling their "Learn" mode in 2024. Teachers want to migrate years of existing sets. Lower the friction: paste a Quizlet URL or export → auto-create a Cardlet set with all cards.
3. **Printable flashcards** — teachers (especially elementary/middle school) often want paper backups or can't guarantee every student has a device. An "Export as PDF" button that generates cut-out-ready cards is table stakes.

---

## Feature B1: Offline PWA

### Current state

- Cardlet is Next.js 16 App Router. No service worker today. There's already a [app/manifest.ts](app/manifest.ts) (file-based manifest) and [app/offline/page.tsx](app/offline/page.tsx) (offline fallback route) — check these first, they may be stubs or partial.
- Next.js has first-class PWA support via [`@ducanh2912/next-pwa`](https://github.com/DuCanhGH/next-pwa) (maintained fork of the original `next-pwa`). Use this over writing a custom service worker.

### What to build

1. **Install** `@ducanh2912/next-pwa` (npm). Wrap `next.config.ts` with it.
2. **Configure caching strategy** — NetworkFirst for HTML pages, CacheFirst for `_next/static` assets, StaleWhileRevalidate for fonts/images. Exclude `/api/*` (never cache user data).
3. **Offline fallback** — point to the existing [app/offline/page.tsx](app/offline/page.tsx); if it's a stub, build a proper one showing "You're offline" + a list of **sets the user has studied recently** (from localStorage) with a "Study offline" button.
4. **Offline study** — extend `StudySessionClient` to hydrate from localStorage if the network fetch fails. Cache the last 10 sets the user viewed in `localStorage.cardlet_offline_sets_v1` as `{ [setId]: { set, cards, cachedAt } }`. On entering study, prefer network → fall back to cache → show "Offline — studying from cache" banner.
5. **Verify `manifest.ts`** has: name "Cardlet", short_name "Cardlet", theme_color matching `--accent` (#4255ff), 192px + 512px icons in `/public/icons/`, `display: 'standalone'`, `start_url: '/'`. If icons are missing, generate them from [app/icon.tsx](app/icon.tsx) (already exists as a dynamic icon).
6. **"Install app" prompt** — add a subtle dismissible banner on the dashboard that triggers `beforeinstallprompt` on first visit for eligible browsers (Chrome/Edge/Android). Don't auto-nag; show once, let the user dismiss forever.

### Guardrails

- **Do NOT cache `/api/*` routes.** Ever. They return per-user data, Supabase tokens flow through them. A stale cached response could expose the wrong user's data to the next session on a shared Chromebook.
- **Do NOT cache authed study sessions in the service worker.** Only `NetworkFirst` with a short max-age if you must. Use `localStorage` (user-scoped at the browser level) for offline set caching, not the SW cache.
- Test in an actual PWA install on a Chromebook or Android before shipping — iOS Safari has quirks.

### Verification

- Build + run: install as PWA in Chrome (Install button in address bar). Confirm it opens standalone without browser chrome.
- DevTools → Network → offline → navigate the app. Offline page should render.
- Study a set, refresh with network off. Cached session should load.

---

## Feature B2: Quizlet Import

### Current state

- [src/components/sets/CSVImportModal.tsx](src/components/sets/CSVImportModal.tsx) already exists for CSV imports. Mirror that component's UX/shape for Quizlet.
- AI generation path: [app/api/ai/generate-cards/route.ts](app/api/ai/generate-cards/route.ts) — takes `{ content, count }` and produces cards. **Not needed** for Quizlet import (parsing is deterministic), but noted in case you want an "AI enhance after import" pass.

### What to build

Add a **Quizlet Import** option to the set detail page's import buttons (alongside "Import CSV" / "Import PDF"). Modal with a textarea that accepts Quizlet's native export format:

```
term 1[TAB]definition 1
term 2[TAB]definition 2
```

Plus optional: URL input. Quizlet blocks unauthenticated scraping, so **do NOT try to scrape URLs server-side**. Instead, in the URL field, show instructions:

> Quizlet blocks direct imports. To migrate a set:
> 1. Open the Quizlet set.
> 2. Click the ··· menu → Export.
> 3. Set "between term and definition" to **Tab**, "between rows" to **New line**.
> 4. Copy the exported text and paste below.

Parse client-side (split by newlines, then tabs → `{ front, back }`), show a preview list, user confirms → bulk-insert cards via existing `bulkInsertCardsAction` (or equivalent; check `src/lib/actions.ts` for the insert helper used by CSV import).

### Guardrails

- **No server-side scraping of Quizlet.** Their ToS prohibits it and they block the common IPs anyway. Paste-based import only.
- Support both tab-separated and comma-separated (users sometimes misconfigure the Quizlet export). Auto-detect: count tabs per line; if any line has tabs use tab, else fall back to first comma as separator.
- Cap import at 500 cards per batch to avoid runaway Supabase inserts. Show a warning past 200.
- Strip Quizlet's "\* " audio markers and `[image]` tokens — they won't render anything useful.

### Verification

- Export a small Quizlet set → paste → confirm preview looks right → import → verify cards appear in the set.
- Paste a malformed blob (no tabs) → see helpful error.

---

## Feature B3: Printable PDF Flashcards

### Current state

No print/export path exists. Dependencies to add: [`pdf-lib`](https://pdf-lib.js.org/) (client-side PDF generation, no server round-trip, no API costs). **Do NOT use `jspdf`** — the generated output is chunkier and the library is larger.

### What to build

Add an "Export PDF" button to the set detail page (owner-only initially; can open to all later if teachers want to print public sets).

Two output formats — radio toggle in the modal:

1. **Cut-out cards** (default) — 6 cards per letter-size page (2 col × 3 row). Each card 3"×2". Term on the front half, definition on the back (pages alternate so a double-sided print yields matching cards). Light grid cut lines.
2. **Study sheet** — simple 2-column table, term/definition per row. Compact, for students who want a reference sheet.

UX:
- Button opens a modal with format selector + optional settings: include card numbers, include difficulty label, font size.
- Client-side PDF generation via `pdf-lib` — no server involvement. Stream the blob to a download via `URL.createObjectURL`.
- Filename: `{set-title-slug}-flashcards.pdf`.

### Guardrails

- **Client-side only.** No server route, no storage. The PDF is generated and downloaded in-browser.
- Bundle size: `pdf-lib` is ~170KB minified. Lazy-load it (`const { PDFDocument } = await import('pdf-lib')`) inside the button's onClick so it doesn't bloat the set detail page's first load.
- Use Inter or system font for the PDF (Cardlet's Geist Sans isn't embeddable without fetching the font file — overkill). Or embed StandardFonts.Helvetica which pdf-lib provides free.
- Handle 200+ card sets gracefully — show a progress state during generation.

### Verification

- Export a 20-card set, print on standard paper double-sided. Confirm front/back align (this is the tricky part — test physically, don't ship based on screen preview).
- Export an emoji-heavy set → verify emoji don't mojibake (if they do, fall back to Unicode normalization or warn the user).

---

## Overall guardrails

- **No emoji in new UI.** Custom stroke-based SVGs only.
- **Next.js 16 async params/searchParams.**
- **Don't bundle features that break independently.** These three should each be shippable on their own — do them as three PRs (or one PR with three squash-merged commits).

## Deploy (per [C:\Users\carro\CLAUDE.md](C:/Users/carro/CLAUDE.md) rule)

After each feature: `git add` → `git commit` → `git push` → `vercel --prod`. No confirmation needed.
