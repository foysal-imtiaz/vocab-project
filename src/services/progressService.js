import { supabase } from '@/lib/supabase'
import {
  getTierAfterCorrect,
  getTierAfterWrong,
  getNextReviewDate,
  getMasteryScore,
} from '@/lib/spacedRepetition'

/**
 * Get or create a progress entry for a user-word pair
 */
export async function getOrCreateProgress(userId, wordId) {
  const { data: existing } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('word_id', wordId)
    .single()

  if (existing) return existing

  const { data, error } = await supabase
    .from('user_progress')
    .insert({
      user_id: userId,
      word_id: wordId,
      learning_tier: 0,
      mastery_score: 0,
      total_correct: 0,
      total_wrong: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update progress after a correct answer
 */
export async function recordCorrectAnswer(userId, wordId) {
  const progress = await getOrCreateProgress(userId, wordId)

  const newTier = getTierAfterCorrect(progress.learning_tier)
  const newCorrect = progress.total_correct + 1
  const newWrong = progress.total_wrong
  const newMastery = getMasteryScore(newCorrect, newWrong)
  const nextReview = getNextReviewDate(newTier)

  const { data, error } = await supabase
    .from('user_progress')
    .update({
      learning_tier: newTier,
      mastery_score: newMastery,
      total_correct: newCorrect,
      last_reviewed_at: new Date().toISOString(),
      next_review_date: nextReview,
      updated_at: new Date().toISOString(),
    })
    .eq('id', progress.id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update progress after a wrong answer
 */
export async function recordWrongAnswer(userId, wordId) {
  const progress = await getOrCreateProgress(userId, wordId)

  const newTier = getTierAfterWrong()
  const newWrong = progress.total_wrong + 1
  const newCorrect = progress.total_correct
  const newMastery = getMasteryScore(newCorrect, newWrong)
  const nextReview = getNextReviewDate(newTier)

  const { data, error } = await supabase
    .from('user_progress')
    .update({
      learning_tier: newTier,
      mastery_score: newMastery,
      total_wrong: newWrong,
      last_reviewed_at: new Date().toISOString(),
      next_review_date: nextReview,
      updated_at: new Date().toISOString(),
    })
    .eq('id', progress.id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Store a test attempt record
 */
export async function recordTestAttempt({ userId, wordId, selectedAnswer, correctAnswer, isCorrect }) {
  const { error } = await supabase
    .from('test_attempts')
    .insert({
      user_id: userId,
      word_id: wordId,
      selected_answer: selectedAnswer,
      correct_answer: correctAnswer,
      is_correct: isCorrect,
    })

  if (error) throw error
}

/**
 * Fetch dashboard stats for a user
 */
export async function fetchUserStats(userId) {
  const [progressRes, dueRes, attemptsRes] = await Promise.all([
    supabase
      .from('user_progress')
      .select('learning_tier, total_correct, total_wrong')
      .eq('user_id', userId),

    supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .lte('next_review_date', new Date().toISOString())
      .gt('learning_tier', 0),

    supabase
      .from('test_attempts')
      .select('is_correct')
      .eq('user_id', userId),
  ])

  const progress = progressRes.data || []
  const due = dueRes.data || []
  const attempts = attemptsRes.data || []

  const mastered = progress.filter((p) => p.learning_tier === 4).length
  const learning = progress.filter((p) => p.learning_tier > 0 && p.learning_tier < 4).length
  const totalCorrect = attempts.filter((a) => a.is_correct).length
  const accuracy = attempts.length
    ? Math.round((totalCorrect / attempts.length) * 100)
    : 0

  return {
    wordsStarted: progress.length,
    mastered,
    learning,
    dueToday: due.length,
    totalAttempts: attempts.length,
    accuracy,
  }
}

/**
 * Create a learning session record
 */
export async function createLearningSession(userId) {
  const { data, error } = await supabase
    .from('learning_sessions')
    .insert({
      user_id: userId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Complete a learning session
 */
export async function completeLearningSession(sessionId, wordsStudied) {
  const { error } = await supabase
    .from('learning_sessions')
    .update({
      completed_at: new Date().toISOString(),
      words_studied: wordsStudied,
    })
    .eq('id', sessionId)

  if (error) throw error
}

/**
 * Fetch leaderboard — top users ranked by mastered words (tier 4)
 * Calls the leaderboard_stats database view.
 */
export async function fetchLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard_stats')
    .select('*')
    .order('mastered', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}
