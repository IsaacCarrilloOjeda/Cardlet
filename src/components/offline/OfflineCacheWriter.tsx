'use client'

import { useEffect } from 'react'
import { cacheSet } from '@/lib/offlineCache'
import type { Card, StudySet } from '@/types'

interface Props {
  set: StudySet
  cards: Card[]
}

/**
 * Silently persists the current set + cards to localStorage so the user can
 * study it later on /offline when the network drops. Renders nothing.
 */
export function OfflineCacheWriter({ set, cards }: Props) {
  useEffect(() => {
    cacheSet(set, cards)
  }, [set, cards])

  return null
}
