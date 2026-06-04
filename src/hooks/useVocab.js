import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import {
  fetchWordsWithProgress,
  fetchDueWords,
  fetchNewWords,
} from '@/services/wordsService'
import {
  fetchUserStats,
  recordCorrectAnswer,
  recordWrongAnswer,
  recordTestAttempt,
  createLearningSession,
  completeLearningSession,
} from '@/services/progressService'

export const queryKeys = {
  words: (params) => ['words', params],
  dueWords: (userId) => ['due-words', userId],
  newWords: (userId, limit) => ['new-words', userId, limit],
  userStats: (userId) => ['user-stats', userId],
}

/**
 * Hook: paginated vocabulary list.
 * Works for both authenticated (with progress) and public (without) users.
 */
export function useWords(params) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: queryKeys.words({ ...params, userId: user?.id }),
    queryFn: () => fetchWordsWithProgress({ ...params, userId: user?.id || null }),
    enabled: true,
    keepPreviousData: true,
  })
}

/**
 * Hook: words due for review
 */
export function useDueWords() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: queryKeys.dueWords(user?.id),
    queryFn: () => fetchDueWords(user.id),
    enabled: !!user,
  })
}

/**
 * Hook: new words for a learning session
 */
export function useNewWords(limit = 10, enabled = true) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: queryKeys.newWords(user?.id, limit),
    queryFn: () => fetchNewWords(user.id, limit),
    enabled: !!user && enabled,
  })
}

/**
 * Hook: user dashboard stats
 */
export function useUserStats() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: queryKeys.userStats(user?.id),
    queryFn: () => fetchUserStats(user.id),
    enabled: !!user,
  })
}

/**
 * Hook: record an MCQ answer
 */
export function useRecordAnswer() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ wordId, selectedAnswer, correctAnswer, isCorrect }) => {
      await recordTestAttempt({
        userId: user.id,
        wordId,
        selectedAnswer,
        correctAnswer,
        isCorrect,
      })
      if (isCorrect) {
        return recordCorrectAnswer(user.id, wordId)
      } else {
        return recordWrongAnswer(user.id, wordId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stats', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['due-words', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['words'] })
    },
  })
}

/**
 * Hook: create a learning session
 */
export function useCreateSession() {
  const { user } = useAuthStore()
  return useMutation({
    mutationFn: () => createLearningSession(user.id),
  })
}

/**
 * Hook: complete a learning session
 */
export function useCompleteSession() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  return useMutation({
    mutationFn: ({ sessionId, wordsStudied }) =>
      completeLearningSession(sessionId, wordsStudied),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stats', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['new-words', user?.id] })
    },
  })
}
