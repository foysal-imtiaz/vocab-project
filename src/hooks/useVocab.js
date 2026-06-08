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
  userStats: (userId) => ['user-stats', userId],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stats', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['due-words', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['learned-words', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['words'] })
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stats', user?.id] })
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stats', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['new-words', user?.id] })
    },
  })
}
