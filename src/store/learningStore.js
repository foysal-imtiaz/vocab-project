import { create } from 'zustand'

export const useLearningStore = create((set, get) => ({
  // Session state
  sessionId: null,
  sessionWords: [],
  currentIndex: 0,
  sessionComplete: false,
  batchSize: 10,

  // MCQ state
  mcqActive: false,
  mcqWords: [],
  mcqCurrentIndex: 0,
  mcqResults: [],
  mcqComplete: false,

  // Actions
  startSession: (words, sessionId) => set({
    sessionId,
    sessionWords: words,
    currentIndex: 0,
    sessionComplete: false,
    mcqActive: false,
    mcqWords: [],
    mcqCurrentIndex: 0,
    mcqResults: [],
    mcqComplete: false,
  }),

  nextWord: () => {
    const { currentIndex, sessionWords } = get()
    const next = currentIndex + 1
    if (next >= sessionWords.length) {
      set({ sessionComplete: true })
    } else {
      set({ currentIndex: next })
    }
  },

  startMcq: () => {
    const { sessionWords } = get()
    set({
      mcqActive: true,
      mcqWords: [...sessionWords],
      mcqCurrentIndex: 0,
      mcqResults: [],
      mcqComplete: false,
    })
  },

  submitMcqAnswer: (wordId, selectedAnswer, correctAnswer, isCorrect) => {
    const { mcqResults, mcqCurrentIndex, mcqWords } = get()
    const newResults = [
      ...mcqResults,
      { wordId, selectedAnswer, correctAnswer, isCorrect },
    ]
    const next = mcqCurrentIndex + 1
    if (next >= mcqWords.length) {
      set({ mcqResults: newResults, mcqComplete: true })
    } else {
      set({ mcqResults: newResults, mcqCurrentIndex: next })
    }
  },

  resetSession: () => set({
    sessionId: null,
    sessionWords: [],
    currentIndex: 0,
    sessionComplete: false,
    mcqActive: false,
    mcqWords: [],
    mcqCurrentIndex: 0,
    mcqResults: [],
    mcqComplete: false,
  }),

  setBatchSize: (size) => set({ batchSize: size }),

  // Computed
  get currentWord() {
    const { sessionWords, currentIndex } = get()
    return sessionWords[currentIndex] || null
  },

  get progress() {
    const { currentIndex, sessionWords } = get()
    if (!sessionWords.length) return 0
    return Math.round((currentIndex / sessionWords.length) * 100)
  },

  get mcqScore() {
    const { mcqResults } = get()
    if (!mcqResults.length) return 0
    const correct = mcqResults.filter((r) => r.isCorrect).length
    return Math.round((correct / mcqResults.length) * 100)
  },
}))
