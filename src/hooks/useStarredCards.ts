'use client'

import { useState, useCallback, useEffect } from 'react'

function storageKey(setId: string) {
  return `cardlet_starred_${setId}`
}

function load(setId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(setId))
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function save(setId: string, starred: Set<string>) {
  try {
    localStorage.setItem(storageKey(setId), JSON.stringify([...starred]))
  } catch {
    // storage unavailable
  }
}

export function useStarredCards(setId: string) {
  const [starred, setStarred] = useState<Set<string>>(new Set())

  useEffect(() => {
    setStarred(load(setId))
  }, [setId])

  const toggle = useCallback(
    (cardId: string) => {
      setStarred((prev) => {
        const next = new Set(prev)
        if (next.has(cardId)) {
          next.delete(cardId)
        } else {
          next.add(cardId)
        }
        save(setId, next)
        return next
      })
    },
    [setId]
  )

  const isStarred = useCallback((cardId: string) => starred.has(cardId), [starred])

  return { isStarred, toggle, starredIds: starred }
}
