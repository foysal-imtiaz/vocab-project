// 4-state system (3 active tiers + New):
//   0 = New      — studied but not yet reviewed
//   1 = Learned  — review next day (1 day)
//   2 = Advanced — review in 3 days
//   3 = Mastered — never reviewed again

export const TIER_INTERVALS = {
  0: 0,    // New — no review scheduled
  1: 1,    // Learned — review tomorrow
  2: 3,    // Advanced — review in 3 days
  3: null, // Mastered — no review ever
}

export const MAX_TIER = 3
export const MIN_TIER = 0

/**
 * Next review date. Returns null for Mastered.
 */
export function getNextReviewDate(tier) {
  if (tier === 3) return null
  const days = TIER_INTERVALS[tier] ?? 1
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

/**
 * Correct answer → move up one tier (capped at Mastered)
 */
export function getTierAfterCorrect(currentTier) {
  return Math.min(currentTier + 1, MAX_TIER)
}

/**
 * Wrong answer → stay at current tier (minimum Learned=1)
 * New(0) should never be in review, but guard anyway.
 */
export function getTierAfterWrong(currentTier) {
  return Math.max(currentTier, 1)
}

/**
 * Is a word due for review?
 * Mastered (null next_review_date) is never due.
 */
export function isDueForReview(nextReviewDate) {
  if (!nextReviewDate) return false
  return new Date(nextReviewDate) <= new Date()
}

/**
 * Tier label and color
 */
export function getTierInfo(tier) {
  const tiers = {
    0: { label: 'New',      color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
    1: { label: 'Learned',  color: 'bg-orange-50 text-orange-600', dot: 'bg-orange-400' },
    2: { label: 'Advanced', color: 'bg-blue-50 text-blue-600',     dot: 'bg-blue-400' },
    3: { label: 'Mastered', color: 'bg-green-50 text-green-600',   dot: 'bg-green-500' },
  }
  return tiers[tier] ?? tiers[0]
}

/**
 * Mastery score as percentage
 */
export function getMasteryScore(totalCorrect, totalWrong) {
  const total = totalCorrect + totalWrong
  if (total === 0) return 0
  return Math.round((totalCorrect / total) * 100)
}

/**
 * Fisher-Yates shuffle
 */
export function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Build MCQ options: correct answer + up to 3 distractors
 */
export function buildMcqOptions(word) {
  const correctAnswer = word.bangla_meaning
  const distractors = word.mcq_options
    ? word.mcq_options.filter((opt) => opt !== correctAnswer)
    : []
  const picked = shuffleArray(distractors).slice(0, 3)
  const options = shuffleArray([correctAnswer, ...picked])
  return { options, correctAnswer }
}

/**
 * Exam time limits in seconds based on question count
 */
export const EXAM_TIME_LIMITS = {
  20: 7 * 60,   // 7 minutes
  30: 11 * 60,  // 11 minutes
  40: 15 * 60,  // 15 minutes
  50: 22 * 60,  // 22 minutes
}

export const EXAM_SIZES = [20, 30, 40, 50]
