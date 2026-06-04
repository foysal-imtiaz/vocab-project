// Tier-based spaced repetition intervals (in days)
// 4 active tiers + tier 0 (New, unseen)
export const TIER_INTERVALS = {
  0: 0,   // New — not yet reviewed
  1: 3,   // Learned — review in 3 days
  2: 7,   // Practiced — review in 7 days
  3: 14,  // Advanced — review in 14 days
  4: 30,  // Mastered — review in 30 days
}

export const MAX_TIER = 4
export const MIN_TIER = 0

/**
 * Calculate the next review date based on tier
 */
export function getNextReviewDate(tier) {
  const days = TIER_INTERVALS[tier] ?? 3
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

/**
 * Calculate new tier after answering correctly
 */
export function getTierAfterCorrect(currentTier) {
  return Math.min(currentTier + 1, MAX_TIER)
}

/**
 * Calculate new tier after answering incorrectly.
 * Drops back to Learned (tier 1) so it resurfaces in 3 days.
 */
export function getTierAfterWrong() {
  return 1
}

/**
 * Determine if a word is due for review
 */
export function isDueForReview(nextReviewDate) {
  if (!nextReviewDate) return false
  const now = new Date()
  const reviewDate = new Date(nextReviewDate)
  return reviewDate <= now
}

/**
 * Get tier label and color for display
 */
export function getTierInfo(tier) {
  const tiers = {
    0: { label: 'New',      color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
    1: { label: 'Learned',  color: 'bg-orange-50 text-orange-600', dot: 'bg-orange-400' },
    2: { label: 'Practiced',color: 'bg-blue-50 text-blue-600',     dot: 'bg-blue-400' },
    3: { label: 'Advanced', color: 'bg-violet-50 text-violet-600', dot: 'bg-violet-400' },
    4: { label: 'Mastered', color: 'bg-green-50 text-green-600',   dot: 'bg-green-500' },
  }
  return tiers[tier] ?? tiers[0]
}

/**
 * Calculate mastery score as a percentage (0–100)
 */
export function getMasteryScore(totalCorrect, totalWrong) {
  const total = totalCorrect + totalWrong
  if (total === 0) return 0
  return Math.round((totalCorrect / total) * 100)
}

/**
 * Shuffle array using Fisher-Yates algorithm
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
 * Build MCQ options: include correct answer + 3 distractors from mcq_options
 */
export function buildMcqOptions(word) {
  const correctAnswer = word.bangla_meaning
  const distractors = word.mcq_options
    ? word.mcq_options.filter((opt) => opt !== correctAnswer)
    : []

  // Pick up to 3 distractors
  const picked = shuffleArray(distractors).slice(0, 3)
  const options = shuffleArray([correctAnswer, ...picked])

  return { options, correctAnswer }
}
