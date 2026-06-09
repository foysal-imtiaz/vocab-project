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
 * Mark a word as Learned (tier 1) after studying it.
 * Called when user finishes studying a word in a learning session.
 */
export async function markWordAsLearned(userId, wordId) {
  const progress = await getOrCreateProgress(userId, wordId)

  // Only promote New (0) words — don't demote already-learned words
  if (progress.learning_tier > 0) return progress

  const nextReview = getNextReviewDate(1) // tomorrow

  const { data, error } = await supabase
    .from('user_progress')
    .update({
      learning_tier: 1,
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
 * Record a correct answer in review or exam.
 * Learned(1) correct → Advanced(2), review in 3 days
 * Advanced(2) correct → Mastered(3), no future review
 */
export async function recordCorrectAnswer(userId, wordId) {
  const progress = await getOrCreateProgress(userId, wordId)

  const newTier = getTierAfterCorrect(progress.learning_tier)
  const newCorrect = progress.total_correct + 1
  const newMastery = getMasteryScore(newCorrect, progress.total_wrong)
  const nextReview = newTier === 3 ? null : getNextReviewDate(newTier)

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
 * Record a wrong answer in review or exam.
 * Learned(1) wrong → stays Learned(1), review tomorrow
 * Advanced(2) wrong → stays Advanced(2), review in 3 days
 */
export async function recordWrongAnswer(userId, wordId) {
  const progress = await getOrCreateProgress(userId, wordId)

  const newTier = getTierAfterWrong(progress.learning_tier)
  const newWrong = progress.total_wrong + 1
  const newMastery = getMasteryScore(progress.total_correct, newWrong)
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
 * Store a test attempt record (does NOT update user_progress tier)
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
 * Record attempt AND update spaced repetition tier.
 * Use this in Review and Exam — NOT in the post-study MCQ in Learn.
 */
export async function recordAnswerWithTierUpdate({ userId, wordId, selectedAnswer, correctAnswer, isCorrect }) {
  await recordTestAttempt({ userId, wordId, selectedAnswer, correctAnswer, isCorrect })
  if (isCorrect) {
    return recordCorrectAnswer(userId, wordId)
  } else {
    return recordWrongAnswer(userId, wordId)
  }
}

/**
 * Fetch dashboard stats
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

  const mastered = progress.filter((p) => p.learning_tier === 3).length
  const advanced = progress.filter((p) => p.learning_tier === 2).length
  const learning = progress.filter((p) => p.learning_tier === 1).length
  const totalCorrect = attempts.filter((a) => a.is_correct).length
  const accuracy = attempts.length
    ? Math.round((totalCorrect / attempts.length) * 100)
    : 0

  return {
    wordsStarted: progress.length,
    mastered,
    advanced,
    learning,
    dueToday: due.length,
    totalAttempts: attempts.length,
    accuracy,
  }
}

/**
 * Fetch learned words (tier 1 + tier 2) available for exam
 */
export async function fetchLearnedWords(userId) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*, words(*)')
    .eq('user_id', userId)
    .in('learning_tier', [1, 2])
    .order('last_reviewed_at', { ascending: true })

  if (error) throw error
  return (data || []).map((p) => ({
    ...p.words,
    progress: { ...p, words: undefined },
  }))
}

/**
 * Create a learning session
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
 * Fetch leaderboard sorted by composite score
 */
export async function fetchLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard_stats')
    .select('*')
    .order('score', { ascending: false })
    .order('mastered', { ascending: false })
    .order('total_words', { ascending: false })
    .order('accuracy', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

/**
 * Fetch mastered words (tier 3) for mastered exam
 */
export async function fetchMasteredWords(userId) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*, words(*)')
    .eq('user_id', userId)
    .eq('learning_tier', 3)
    .order('last_reviewed_at', { ascending: true })

  if (error) throw error
  return (data || []).map((p) => ({
    ...p.words,
    progress: { ...p, words: undefined },
  }))
}
