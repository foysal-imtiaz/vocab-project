import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import {
  fetchWordsWithProgress,
  fetchDueWords,
  fetchNewWords,
} from '@/services/wordsService'
import {
  fetchUserStats,
  fetchLearnedWords,
  fetchMasteredWords,
  recordTestAttempt,
  recordAnswerWithTierUpdate,
  createLearningSession,
  completeLearningSession,
} from '@/services/progressService'

export const queryKeys = {
  words: (params) => ['words', params],
  dueWords: (userId) => ['due-words', userId],
  newWords: (userId, limit) => ['new-words', userId, limit],
  learnedWords: (userId) => ['learned-words', userId],
  masteredWords: (userId) => ['mastered-words', userId],
  userStats: (userId) => ['user-stats', userId],
}

// Invalidate ALL user-related queries at once — call this after any progress change
function invalidateAll(queryClient, userId) {
  queryClient.invalidateQueries({ queryKey: ['user-stats', userId] })
  queryClient.invalidateQueries({ queryKey: ['due-words', userId] })
  queryClient.invalidateQueries({ queryKey: ['learned-words', userId] })
  queryClient.invalidateQueries({ queryKey: ['new-words', userId] })
  queryClient.invalidateQueries({ queryKey: ['words'] })
}

export function useWords(params) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: queryKeys.words({ ...params, userId: user?.id }),
    queryFn: () => fetchWordsWithProgress({ ...params, userId: user?.id || null }),
    enabled: true,
    keepPreviousData: true,
  })
}

export function useDueWords() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: queryKeys.dueWords(user?.id),
    queryFn: () => fetchDueWords(user.id),
    enabled: !!user,
  })
}

export function useNewWords(limit = 10, enabled = true) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: queryKeys.newWords(user?.id, limit),
    queryFn: () => fetchNewWords(user.id, limit),
    enabled: !!user && enabled,
  })
}

export function useLearnedWords() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: queryKeys.learnedWords(user?.id),
    queryFn: () => fetchLearnedWords(user.id),
    enabled: !!user,
  })
}

export function useMasteredWords() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: queryKeys.masteredWords(user?.id),
    queryFn: () => fetchMasteredWords(user.id),
    enabled: !!user,
  })
}

export function useUserStats() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: queryKeys.userStats(user?.id),
    queryFn: () => fetchUserStats(user.id),
    enabled: !!user,
  })
}

/**
 * For Review and Exam — records attempt AND updates spaced repetition tier.
 */
export function useRecordAnswer() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ wordId, selectedAnswer, correctAnswer, isCorrect }) =>
      recordAnswerWithTierUpdate({ userId: user.id, wordId, selectedAnswer, correctAnswer, isCorrect }),
    onSuccess: () => invalidateAll(queryClient, user?.id),
  })
}

/**
 * For Learn session MCQ — records attempt for accuracy stats ONLY.
 * Does NOT change learning tier (words stay Learned after studying).
 */
export function useRecordStudyAttempt() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ wordId, selectedAnswer, correctAnswer, isCorrect }) =>
      recordTestAttempt({ userId: user.id, wordId, selectedAnswer, correctAnswer, isCorrect }),
    onSuccess: () => invalidateAll(queryClient, user?.id),
  })
}

export function useCreateSession() {
  const { user } = useAuthStore()
  return useMutation({
    mutationFn: () => createLearningSession(user.id),
  })
}

export function useCompleteSession() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  return useMutation({
    mutationFn: ({ sessionId, wordsStudied }) => completeLearningSession(sessionId, wordsStudied),
    onSuccess: () => invalidateAll(queryClient, user?.id),
  })
}
