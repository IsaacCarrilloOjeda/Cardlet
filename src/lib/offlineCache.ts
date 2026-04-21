/**
 * Client-side offline cache for recently-viewed study sets.
 * Keyed by setId. Keeps last 10 sets, LRU-evicted by cachedAt.
 *
 * NOT a service-worker cache — this is localStorage so it is user-scoped
 * at the browser level (different user on the same device can't read it).
 */

import type { Card, StudySet } from '@/types'

const KEY = 'cardlet_offline_sets_v1'
const MAX_SETS = 10

export interface CachedSet {
  set: StudySet
  cards: Card[]
  cachedAt: number
}

type CacheShape = Record<string, CachedSet>

function read(): CacheShape {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as CacheShape) : {}
  } catch {
    return {}
  }
}

function write(data: CacheShape): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // Quota exceeded or disabled. Ignore — caching is best-effort.
  }
}

export function cacheSet(set: StudySet, cards: Card[]): void {
  const data = read()
  data[set.id] = { set, cards, cachedAt: Date.now() }

  // Evict LRU beyond MAX_SETS.
  const entries = Object.entries(data)
  if (entries.length > MAX_SETS) {
    entries.sort((a, b) => b[1].cachedAt - a[1].cachedAt)
    const keep = Object.fromEntries(entries.slice(0, MAX_SETS))
    write(keep)
  } else {
    write(data)
  }
}

export function getCachedSet(setId: string): CachedSet | null {
  const data = read()
  return data[setId] ?? null
}

export function listCachedSets(): CachedSet[] {
  const data = read()
  return Object.values(data).sort((a, b) => b.cachedAt - a.cachedAt)
}

export function clearCache(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
