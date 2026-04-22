// Shared localStorage helpers for the Languages tab.
// All keys use the `cardlet-lang-*` prefix.

export const MAX_HEARTS = 5
export const HEART_REFILL_MS = 30 * 60 * 1000
export const HEART_REFILL_COST = 20

const HEARTS_KEY        = 'cardlet-lang-hearts'
const STREAK_KEY        = 'cardlet-lang-streak'
const DAILY_GOAL_KEY    = 'cardlet-lang-daily-goal'
const AUDIO_MODE_KEY    = 'cardlet-lang-audio-mode'
const MISTAKES_KEY      = 'cardlet-lang-mistakes'
const CHECKPOINTS_KEY   = 'cardlet-lang-checkpoints'

// Event bus so UI subscribers refresh without polling the full state
const EVENT = 'cardlet-lang-storage-update'
function emit() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENT))
}
export function subscribeLangStorage(cb: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVENT, cb)
  return () => window.removeEventListener(EVENT, cb)
}

// ─── Hearts ────────────────────────────────────────────────────────────────────
interface HeartsStored { hearts: number; lastRefillAt: string }

function loadHearts(): HeartsStored {
  if (typeof window === 'undefined') return { hearts: MAX_HEARTS, lastRefillAt: new Date().toISOString() }
  try {
    const raw = localStorage.getItem(HEARTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { hearts: MAX_HEARTS, lastRefillAt: new Date().toISOString() }
}

function saveHearts(s: HeartsStored) {
  if (typeof window === 'undefined') return
  localStorage.setItem(HEARTS_KEY, JSON.stringify(s))
}

/** Current hearts + ms until next refill tick. Lazily accrues refills. */
export function getCurrentHearts(): { hearts: number; msToNext: number } {
  const s = loadHearts()
  const now = Date.now()
  const last = new Date(s.lastRefillAt).getTime()
  const elapsed = Math.max(0, now - last)
  const refilled = Math.floor(elapsed / HEART_REFILL_MS)
  const hearts = Math.min(MAX_HEARTS, s.hearts + refilled)
  const msToNext = hearts < MAX_HEARTS ? HEART_REFILL_MS - (elapsed - refilled * HEART_REFILL_MS) : 0
  return { hearts, msToNext }
}

/**
 * Decrement one heart, accounting for any pending refills. Returns new count.
 * `lastRefillAt` advances to consume whole-slot refills but preserves the
 * fractional wait so the next refill arrives at its expected time.
 */
export function loseHeart(): number {
  const s = loadHearts()
  const now = Date.now()
  const last = new Date(s.lastRefillAt).getTime()
  const elapsed = Math.max(0, now - last)
  const refilled = Math.floor(elapsed / HEART_REFILL_MS)
  const effective = Math.min(MAX_HEARTS, s.hearts + refilled)
  const newHearts = Math.max(0, effective - 1)
  // If the bar was full before this loss, start a fresh 30-min timer now.
  const newLast = effective === MAX_HEARTS
    ? new Date(now).toISOString()
    : new Date(last + refilled * HEART_REFILL_MS).toISOString()
  saveHearts({ hearts: newHearts, lastRefillAt: newLast })
  emit()
  return newHearts
}

export function refillAllHearts() {
  saveHearts({ hearts: MAX_HEARTS, lastRefillAt: new Date().toISOString() })
  emit()
}

// ─── Streak ────────────────────────────────────────────────────────────────────
interface StreakStored { count: number; lastActivityDate: string }

function localDateStr(d = new Date()): string {
  // YYYY-MM-DD in local time (not UTC) — streak should roll at the user's midnight.
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function loadStreak(): StreakStored {
  if (typeof window === 'undefined') return { count: 0, lastActivityDate: '' }
  try { const raw = localStorage.getItem(STREAK_KEY); if (raw) return JSON.parse(raw) } catch {}
  return { count: 0, lastActivityDate: '' }
}

/** Current streak, factoring in expiry if more than a day has passed. */
export function getStreak(): { count: number; active: boolean } {
  const s = loadStreak()
  if (!s.lastActivityDate) return { count: 0, active: false }
  const today = localDateStr()
  const yesterday = localDateStr(new Date(Date.now() - 86400000))
  if (s.lastActivityDate === today) return { count: s.count, active: true }
  if (s.lastActivityDate === yesterday) return { count: s.count, active: false }
  return { count: 0, active: false }
}

/** Bump the streak when new activity happens today. */
export function bumpStreak() {
  const s = loadStreak()
  const today = localDateStr()
  if (s.lastActivityDate === today) return
  const yesterday = localDateStr(new Date(Date.now() - 86400000))
  const next = s.lastActivityDate === yesterday ? s.count + 1 : 1
  localStorage.setItem(STREAK_KEY, JSON.stringify({ count: next, lastActivityDate: today }))
  emit()
}

// ─── Daily XP goal ─────────────────────────────────────────────────────────────
export const DAILY_GOAL_OPTIONS = [10, 20, 50] as const

export function getDailyGoal(): number {
  if (typeof window === 'undefined') return 20
  const raw = localStorage.getItem(DAILY_GOAL_KEY)
  const n = raw ? parseInt(raw, 10) : 20
  return DAILY_GOAL_OPTIONS.includes(n as 10 | 20 | 50) ? n : 20
}

export function setDailyGoal(n: number) {
  if (typeof window === 'undefined') return
  localStorage.setItem(DAILY_GOAL_KEY, String(n))
  emit()
}

function dailyXpKey(d = localDateStr()) { return `cardlet-lang-daily-xp-${d}` }

export function getDailyXp(): number {
  if (typeof window === 'undefined') return 0
  const raw = localStorage.getItem(dailyXpKey())
  return raw ? parseInt(raw, 10) || 0 : 0
}

export function addDailyXp(amount: number): number {
  if (typeof window === 'undefined') return 0
  const next = getDailyXp() + Math.max(0, amount)
  localStorage.setItem(dailyXpKey(), String(next))
  emit()
  return next
}

// ─── Audio-only mode ───────────────────────────────────────────────────────────
export function getAudioMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(AUDIO_MODE_KEY) === '1'
}
export function setAudioMode(v: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUDIO_MODE_KEY, v ? '1' : '0')
  emit()
}

// ─── Mistakes (weak words) ─────────────────────────────────────────────────────
type MistakeMap = Record<string, Record<string, number>>

function loadMistakes(): MistakeMap {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(MISTAKES_KEY) ?? '{}') as MistakeMap } catch { return {} }
}
function saveMistakes(m: MistakeMap) {
  if (typeof window === 'undefined') return
  localStorage.setItem(MISTAKES_KEY, JSON.stringify(m))
}

export function logMistake(langId: string, word: string) {
  if (!word) return
  const m = loadMistakes()
  const byLang = m[langId] ?? {}
  byLang[word] = (byLang[word] ?? 0) + 1
  m[langId] = byLang
  saveMistakes(m)
  emit()
}

export function clearMistake(langId: string, word: string) {
  const m = loadMistakes()
  const byLang = m[langId]
  if (!byLang || !byLang[word]) return
  byLang[word] = Math.max(0, byLang[word] - 1)
  if (byLang[word] === 0) delete byLang[word]
  saveMistakes(m)
  emit()
}

export function getMistakes(langId: string): Array<{ word: string; count: number }> {
  const m = loadMistakes()
  const byLang = m[langId] ?? {}
  return Object.entries(byLang)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
}

// ─── Checkpoints ───────────────────────────────────────────────────────────────
type Checkpoints = Record<string, string>

function loadCheckpoints(): Checkpoints {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(CHECKPOINTS_KEY) ?? '{}') } catch { return {} }
}

export function hasPassedCheckpoint(unitId: string): boolean {
  return Boolean(loadCheckpoints()[unitId])
}

export function markCheckpointPassed(unitId: string) {
  if (typeof window === 'undefined') return
  const cp = loadCheckpoints()
  cp[unitId] = new Date().toISOString()
  localStorage.setItem(CHECKPOINTS_KEY, JSON.stringify(cp))
  emit()
}

// ─── Daily language challenge ──────────────────────────────────────────────────
function dailyChallengeKey(d = localDateStr()) { return `cardlet-lang-daily-done-${d}` }

export function isDailyChallengeDone(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(dailyChallengeKey()) === '1'
}
export function markDailyChallengeDone() {
  if (typeof window === 'undefined') return
  localStorage.setItem(dailyChallengeKey(), '1')
  emit()
}

/** Deterministic pick — same index all day for a given array length. */
export function dailySeed(mod: number, salt = ''): number {
  const date = localDateStr()
  let h = 0
  for (const c of date + salt) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h) % Math.max(1, mod)
}

export { localDateStr }
