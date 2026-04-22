// Shared helpers for pulling target↔english vocab pairs out of Lesson/Unit
// exercises. Used by the mistake tracker, the weak-words review, and the
// "Export unit as flashcards" feature.

import type { Exercise, Unit } from './lessonData'

export interface VocabPair { target: string; english: string }

export function pairFromExercise(ex: Exercise): VocabPair | null {
  if (ex.type === 'translate') {
    return ex.promptLang === 'target'
      ? { target: ex.prompt, english: ex.answer }
      : { target: ex.answer, english: ex.prompt }
  }
  if (ex.type === 'multipleChoice') {
    const quote = ex.question.match(/["'"'«「]([^"'"'»」]+)["'"'»」]/)?.[1]?.trim()
    const answer = ex.options[ex.correctIndex]
    const targetInQuote = /means?\b|\bmean\?|is\s+english|informal way/i.test(ex.question)
    if (quote) {
      return targetInQuote
        ? { target: quote, english: answer }
        : { target: answer, english: quote }
    }
    return null
  }
  return null
}

/** Deduped vocab list for a whole unit; matchPairs contribute directly. */
export function extractUnitVocab(unit: Unit): VocabPair[] {
  const seen = new Set<string>()
  const out: VocabPair[] = []
  const add = (p: VocabPair) => {
    const t = p.target.trim()
    const e = p.english.trim()
    if (!t || !e) return
    const key = `${t.toLowerCase()}|${e.toLowerCase()}`
    if (seen.has(key)) return
    seen.add(key)
    out.push({ target: t, english: e })
  }

  for (const lesson of unit.lessons) {
    for (const ex of lesson.exercises) {
      if (ex.type === 'matchPairs') {
        for (const [a, b] of ex.pairs) add({ target: a, english: b })
      } else {
        const p = pairFromExercise(ex)
        if (p) add(p)
      }
    }
  }
  return out
}
