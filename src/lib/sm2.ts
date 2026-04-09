export interface SM2Input {
  ease_factor: number
  interval: number
  repetitions: number
}

export interface SM2Result {
  ease_factor: number
  interval: number
  repetitions: number
  next_review_at: Date
}

/**
 * SM-2 spaced repetition algorithm.
 * quality: 0–5 (know=5, struggling=3, unknown=1)
 */
export function computeSM2(input: SM2Input, quality: 0 | 1 | 2 | 3 | 4 | 5): SM2Result {
  let { ease_factor, interval, repetitions } = input

  if (quality < 3) {
    // Failed: reset
    repetitions = 0
    interval = 1
  } else {
    // Passed: advance
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * ease_factor)
    }
    repetitions += 1

    // Update ease factor
    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if (ease_factor < 1.3) ease_factor = 1.3
  }

  const next_review_at = new Date()
  next_review_at.setDate(next_review_at.getDate() + interval)

  return { ease_factor, interval, repetitions, next_review_at }
}

export function qualityFromConfidence(confidence: 'again' | 'hard' | 'good' | 'easy' | 'perfect'): 0 | 1 | 2 | 3 | 4 | 5 {
  switch (confidence) {
    case 'again': return 1
    case 'hard': return 2
    case 'good': return 3
    case 'easy': return 4
    case 'perfect': return 5
  }
}
