import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock, Trophy, CheckCircle2, XCircle, ChevronDown,
  AlertTriangle, GraduationCap, ArrowLeft, ArrowRight, Star, BookOpen,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { useLearnedWords, useMasteredWords, useRecordAnswer } from '@/hooks/useVocab'
import { buildMcqOptions, EXAM_SIZES, MASTERED_EXAM_SIZES, EXAM_TIME_LIMITS, shuffleArray } from '@/lib/spacedRepetition'

const MASTERED_UNLOCK_THRESHOLD = 100 // unlock mastered exam after this many mastered words

/* timer component */
function Timer({ secondsLeft }) {
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const isCritical = secondsLeft <= 30
  const isWarning = secondsLeft <= 60
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold tabular-nums ${
      isCritical ? 'bg-red-50 text-red-600' : isWarning ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-700'
    }`}>
      <Clock size={13} />
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      {isCritical && <span className="ml-1 text-xs font-medium">Almost out of time!</span>}
    </div>
  )
}

/* leave warning message */
function LeaveWarning() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
      <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
      <p className="text-xs text-amber-700">Leaving this page will lose your current exam progress.</p>
    </div>
  )
}

/* mcq question component */
function ExamQuestion({ word, selected, onSelect }) {
  const { options } = useMemo(() => buildMcqOptions(word), [word.id])
  return (
    <div className="space-y-4">
      <div className="text-center py-3">
        <h2 className="text-2xl font-display font-bold text-gray-900">{word.english_word}</h2>
        {word.part_of_speech && (
          <p className="text-sm text-gray-400 mt-1 italic">{word.part_of_speech}</p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium text-left transition-colors duration-150 ${
              selected === opt
                ? 'border-brand-500 bg-brand-50 text-gray-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

/* word card for results */
function ResultWordCard({ result }) {
  const [expanded, setExpanded] = useState(false)
  const word = result.word || {}
  const isCorrect = result.isCorrect

  const examples = Array.isArray(word.example_sentences) ? word.example_sentences
    : word.example_sentences ? [word.example_sentences] : []
  const synonyms = Array.isArray(word.english_definition_synonyms) ? word.english_definition_synonyms
    : word.english_definition_synonyms ? word.english_definition_synonyms.split(',').map(s => s.trim()) : []

  const borderColor = isCorrect ? 'border-green-100' : 'border-red-100'
  const bgColor = isCorrect ? 'bg-green-50/40 hover:bg-green-50' : 'bg-red-50/40 hover:bg-red-50'
  const iconColor = isCorrect ? 'text-green-500' : 'text-red-400'
  const Icon = isCorrect ? CheckCircle2 : XCircle

  return (
    <div className={`border ${borderColor} rounded-xl overflow-hidden`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className={`w-full px-4 py-3 flex items-center gap-3 text-left ${bgColor} transition-colors`}
      >
        <Icon size={14} className={`${iconColor} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-900">{word.english_word}</span>
          {word.part_of_speech && <span className="ml-2 text-xs text-gray-400 italic">{word.part_of_speech}</span>}
          <p className="text-xs text-gray-500 mt-0.5">
            Meaning: <span className="font-medium text-gray-700">{result.correctAnswer}</span>
            {!isCorrect && (
              <>
                <span className="mx-1.5 text-gray-300">·</span>
                {result.selectedAnswer
                  ? <span className="text-red-500">You chose: {result.selectedAnswer}</span>
                  : <span className="text-gray-400 italic">Skipped</span>
                }
              </>
            )}
          </p>
        </div>
        <ChevronDown size={15} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className={`px-4 py-4 space-y-3 border-t ${borderColor} bg-white`}>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Meaning</p>
            <p className="text-sm font-medium text-gray-900">{word.bangla_meaning}</p>
          </div>
          {synonyms.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Synonyms</p>
              <div className="flex flex-wrap gap-1.5">
                {synonyms.map((s, i) => <span key={i} className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">{s}</span>)}
              </div>
            </div>
          )}
          {examples.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Examples</p>
              {examples.map((ex, i) => <p key={i} className="text-xs italic text-gray-600 leading-relaxed">— {ex}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* exam results screen */
function ExamResults({ results, timeTaken, examSize, examType, onRetry, onDone }) {
  const correct = results.filter(r => r.isCorrect).length
  const wrong = results.filter(r => !r.isCorrect && r.selectedAnswer !== null).length
  const skipped = results.filter(r => r.selectedAnswer === null).length
  const rawScore = Math.max(0, correct - wrong * 1.25)
  const scorePct = results.length ? Math.round((rawScore / results.length) * 100) : 0
  const mins = Math.floor(timeTaken / 60)
  const secs = timeTaken % 60
  const wrongResults = results.filter(r => !r.isCorrect)

  const grade = scorePct >= 90 ? { text: 'Excellent! 🎉', color: 'text-green-600' }
    : scorePct >= 75 ? { text: 'Great job! 🌟', color: 'text-brand-600' }
    : scorePct >= 60 ? { text: 'Good effort! 💪', color: 'text-orange-500' }
    : { text: 'Keep studying! 📚', color: 'text-red-500' }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="card p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
          <Trophy size={26} className="text-brand-600" />
        </div>
        <h2 className={`text-2xl font-display font-bold mb-1 ${grade.color}`}>{grade.text}</h2>
        <p className="text-sm text-gray-400 mb-5">
          {examType === 'mastered' ? 'Mastered words exam' : 'Standard exam'} · {examSize} questions
        </p>
        <div className="grid grid-cols-4 gap-2 py-4 border-t border-b border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-gray-900">{scorePct}%</p>
            <p className="text-xs text-gray-500 mt-0.5">Score</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-green-600">{correct}</p>
            <p className="text-xs text-gray-500 mt-0.5">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-red-500">{wrong}</p>
            <p className="text-xs text-gray-500 mt-0.5">Wrong</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-gray-400">{skipped}</p>
            <p className="text-xs text-gray-500 mt-0.5">Skipped</p>
          </div>
        </div>
        <div className="mt-4 px-3 py-2.5 bg-gray-50 rounded-lg text-left space-y-1">
          <p className="text-xs font-semibold text-gray-600">Scoring method</p>
          <p className="text-xs text-gray-500">+1 per correct · −1.25 per wrong (−1 weight + −0.25 penalty) · 0 for skipped</p>
          <p className="text-xs text-gray-500">
            Raw: {correct} − ({wrong} × 1.25) = <span className="font-semibold text-gray-700">{rawScore.toFixed(2)}</span> / {results.length}
          </p>
          <p className="text-xs text-gray-500">Time used: {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</p>
        </div>
      </div>

      {correct > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">✓ Correct ({correct}) — tap to review</p>
          <div className="space-y-2">
            {results.filter(r => r.isCorrect).map((r, i) => (
              <ResultWordCard key={i} result={r} />
            ))}
          </div>
        </div>
      )}

      {wrongResults.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            ✗ Needs Review ({wrongResults.length}) — tap to study
          </p>
          <div className="space-y-2">
            {wrongResults.map((r, i) => <ResultWordCard key={i} result={r} />)}
          </div>
        </div>
      )}

      <div className="flex gap-3 pb-4">
        <button onClick={onRetry} className="btn-secondary flex-1 py-2.5">Try Again</button>
        <button onClick={onDone} className="btn-primary flex-1 py-2.5">Done</button>
      </div>
    </div>
  )
}

/* main exam page */
export default function ExamPage() {
  const navigate = useNavigate()
  const { data: allLearnedWords = [], isLoading: loadingLearned } = useLearnedWords()
  const { data: allMasteredWords = [], isLoading: loadingMastered } = useMasteredWords()
  const recordAnswer = useRecordAnswer()

  const [examType, setExamType] = useState('standard') // 'standard' | 'mastered'
  const [phase, setPhase] = useState('setup')
  const [examSize, setExamSize] = useState(20)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const answersRef = useRef(answers)
  useEffect(() => { answersRef.current = answers }, [answers])
  const [results, setResults] = useState([])
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [timeTaken, setTimeTaken] = useState(0)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  const isLoading = loadingLearned || loadingMastered
  const learnedCount = allLearnedWords.length
  const masteredCount = allMasteredWords.length
  const canStart = learnedCount >= 20
  const canMasteredExam = masteredCount >= MASTERED_UNLOCK_THRESHOLD

  const activePool = examType === 'mastered' ? allMasteredWords : allLearnedWords

  // For mastered exam: 50, 80, 100, or 'all'. For standard: 20, 30, 40, 50.
  const masteredSizeOptions = [
    ...MASTERED_EXAM_SIZES.filter(s => s <= activePool.length),
    ...(activePool.length > 0 ? ['all'] : []),
  ]
  const availableSizes = examType === 'mastered'
    ? masteredSizeOptions
    : EXAM_SIZES.filter(s => s <= activePool.length)

  // Resolve 'all' to actual count for use in exam logic
  const resolvedExamSize = examSize === 'all' ? activePool.length : examSize

  useEffect(() => {
    if (examType === 'mastered' && masteredSizeOptions.length > 0) {
      setExamSize(masteredSizeOptions[0])
    } else if (examType === 'standard') {
      const std = EXAM_SIZES.filter(s => s <= activePool.length)
      if (std.length > 0) setExamSize(std[0])
    }
  }, [activePool.length, examType])

  // Leave warning during exam
  useEffect(() => {
    if (phase !== 'exam') return
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [phase])

  const startExam = () => {
    const count = examSize === 'all' ? activePool.length : examSize
    const shuffled = shuffleArray(activePool).slice(0, count)
    setQuestions(shuffled)
    setCurrentIndex(0)
    const initial = {}
    shuffled.forEach(w => { initial[w.id] = null })
    setAnswers(initial)
    setResults([])
    // For 'all', use nearest defined time limit or scale at ~22s per question
    const timeKey = [20, 30, 40, 50, 80, 100].reduce((prev, curr) =>
      Math.abs(curr - count) < Math.abs(prev - count) ? curr : prev
    )
    setSecondsLeft(EXAM_TIME_LIMITS[timeKey] || Math.round(count * 22))
    startTimeRef.current = Date.now()
    setPhase('exam')
  }

  useEffect(() => {
    if (phase !== 'exam') { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(timerRef.current); handleTimeUp(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  const handleTimeUp = useCallback(() => {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
    setTimeTaken(elapsed)
    submitExam(answersRef.current, elapsed, true)
  }, [questions])

  const handleSelectAnswer = (option) => {
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: option }))
  }

  const handleBack = () => setCurrentIndex(i => Math.max(0, i - 1))

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      clearInterval(timerRef.current)
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
      setTimeTaken(elapsed)
      submitExam(answers, elapsed, false)
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  const submitExam = (finalAnswers, elapsed, timedOut) => {
    const built = questions.map(word => {
      const selected = finalAnswers[word.id]
      const correct = word.bangla_meaning
      const isCorrect = selected !== null && selected === correct
      if (selected !== null) {
        recordAnswer.mutate({ wordId: word.id, selectedAnswer: selected, correctAnswer: correct, isCorrect })
      }
      return { wordId: word.id, word, selectedAnswer: selected, correctAnswer: correct, isCorrect }
    })
    setResults(built)
    setPhase(timedOut ? 'timeout' : 'results')
  }

  const handleRetry = () => { clearInterval(timerRef.current); setPhase('setup') }

  const currentWord = questions[currentIndex]
  const selectedForCurrent = currentWord ? answers[currentWord.id] : null
  const totalSeconds = EXAM_TIME_LIMITS[examSize] || EXAM_TIME_LIMITS[20]
  const answeredCount = Object.values(answers).filter(v => v !== null).length

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto">

        {/* setup screen */}
        {phase === 'setup' && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900">Vocabulary Exam</h1>
              <p className="text-sm text-gray-500 mt-1">
                Test yourself on your vocabulary under timed conditions
              </p>
            </div>

            {isLoading ? (
              <div className="card p-8 text-center">
                <div className="flex gap-1.5 justify-center">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Exam type selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExamType('standard')}
                    className={`card p-4 text-left transition-all ${examType === 'standard' ? 'border-brand-500 bg-brand-50' : 'hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center">
                        <GraduationCap size={14} className="text-brand-600" />
                      </div>
                      <p className={`text-sm font-semibold ${examType === 'standard' ? 'text-brand-700' : 'text-gray-800'}`}>
                        Standard Exam
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Learned + Advanced words ({learnedCount} available)
                    </p>
                  </button>

                  <button
                    onClick={() => canMasteredExam && setExamType('mastered')}
                    disabled={!canMasteredExam}
                    className={`card p-4 text-left transition-all ${
                      !canMasteredExam ? 'opacity-60 cursor-not-allowed' :
                      examType === 'mastered' ? 'border-green-500 bg-green-50' : 'hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                        <Star size={14} className="text-green-600" />
                      </div>
                      <p className={`text-sm font-semibold ${examType === 'mastered' ? 'text-green-700' : 'text-gray-800'}`}>
                        Mastered Exam
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {canMasteredExam
                        ? `${masteredCount} mastered words`
                        : `Unlocks at 100 mastered (${masteredCount}/${MASTERED_UNLOCK_THRESHOLD})`
                      }
                    </p>
                  </button>
                </div>

                {/* Not enough words for standard exam */}
                {examType === 'standard' && !canStart && (
                  <div className="card p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <GraduationCap size={16} className="text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Not enough words yet</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          You need at least <span className="font-semibold">20 Learned or Advanced words</span> to take an exam.
                          You currently have <span className="font-semibold">{learnedCount}</span>.
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 space-y-2">
                      <p className="text-xs font-semibold text-blue-800">How words progress through exams</p>
                      <div className="space-y-1.5 text-xs text-blue-700">
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
                          <span>Answer a <span className="font-medium">Learned</span> word correctly → it advances to <span className="font-medium">Advanced</span></span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
                          <span>Answer an <span className="font-medium">Advanced</span> word correctly → it becomes <span className="font-medium">Mastered</span></span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
                          <span><span className="font-medium">Mastered words</span> do not appear in the standard exam — they graduate out of it</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
                          <span>Once you reach <span className="font-medium">100 Mastered words</span>, a special <span className="font-medium">Mastered Exam</span> unlocks to keep them sharp</span>
                        </div>
                      </div>
                    </div>

                    <button onClick={() => navigate('/learn')} className="btn-primary w-full py-2.5">
                      Go to Learn
                    </button>
                  </div>
                )}

                {/* Enough words — show size selector */}
                {((examType === 'standard' && canStart) || (examType === 'mastered' && canMasteredExam)) && (
                  <div className="card p-6 space-y-6">
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${examType === 'mastered' ? 'bg-green-50' : 'bg-brand-50'}`}>
                      {examType === 'mastered'
                        ? <Star size={16} className="text-green-600 flex-shrink-0" />
                        : <GraduationCap size={16} className="text-brand-600 flex-shrink-0" />
                      }
                      <p className={`text-sm ${examType === 'mastered' ? 'text-green-700' : 'text-brand-700'}`}>
                        <span className="font-semibold">{activePool.length}</span> words available for this exam
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">Number of questions</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {availableSizes.map(size => {
                          const isAll = size === 'all'
                          const actualCount = isAll ? activePool.length : size
                          const isSelected = examSize === size
                          const activeColor = examType === 'mastered' ? 'border-green-500 bg-green-50' : 'border-brand-500 bg-brand-50'
                          const activeText = examType === 'mastered' ? 'text-green-700' : 'text-brand-700'
                          // time label
                          const nearestKey = [20,30,40,50,80,100].reduce((p,c) =>
                            Math.abs(c-actualCount)<Math.abs(p-actualCount)?c:p)
                          const timeLabel = isAll
                            ? `~${Math.round(actualCount * 22 / 60)} min`
                            : `${EXAM_TIME_LIMITS[size] / 60} min`
                          return (
                            <button
                              key={String(size)}
                              onClick={() => setExamSize(size)}
                              className={`py-3 rounded-lg border-2 text-center transition-colors ${
                                isSelected ? activeColor : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <p className={`text-sm font-semibold ${isSelected ? activeText : 'text-gray-700'}`}>
                                {isAll ? `All (${actualCount})` : `${size} words`}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">{timeLabel}</p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 border-t border-gray-100 pt-4">
                      {[
                        examType === 'mastered'
                          ? 'Questions randomly selected from your Mastered words'
                          : 'Questions randomly selected from your Learned & Advanced words',
                        'No feedback during the exam — results shown at the end',
                        'Scoring: +1 correct, −1.25 per wrong (−1 weight + −0.25 penalty), 0 for skipped',
                        `Time limit: ${EXAM_TIME_LIMITS[examSize] / 60} minutes`,
                      ].map((rule, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={startExam}
                      className={`w-full py-3 flex items-center justify-center gap-2 rounded-lg font-medium text-sm transition-colors ${
                        examType === 'mastered'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'btn-primary'
                      }`}
                    >
                      <Clock size={15} />
                      Start {examType === 'mastered' ? 'Mastered' : ''} Exam — {resolvedExamSize} questions
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* active exam screen */}
        {phase === 'exam' && currentWord && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Timer secondsLeft={secondsLeft} />
              <span className="text-sm text-gray-500 font-medium">
                {currentIndex + 1} / {questions.length}
                {answeredCount > 0 && <span className="ml-2 text-xs text-gray-400">({answeredCount} answered)</span>}
              </span>
            </div>

            <LeaveWarning />

            <ExamQuestion
              word={currentWord}
              selected={selectedForCurrent}
              onSelect={handleSelectAnswer}
            />

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                disabled={currentIndex === 0}
                className="btn-secondary flex items-center justify-center gap-2 px-5 py-3
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={15} />
                Back
              </button>
              <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
                {currentIndex + 1 >= questions.length ? 'Submit Exam' : 'Next'}
                <ArrowRight size={15} />
              </button>
            </div>

            {!selectedForCurrent && (
              <p className="text-xs text-center text-gray-400">
                No answer selected — this question will be skipped (0 points, no penalty)
              </p>
            )}
          </div>
        )}

        {/* time up screen */}
        {phase === 'timeout' && (
          <div className="space-y-6">
            <div className="card p-4 flex items-center gap-3 border-red-200 bg-red-50">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">Time's up!</p>
                <p className="text-xs text-red-500">Unanswered questions were skipped (no penalty).</p>
              </div>
            </div>
            <ExamResults
              results={results}
              timeTaken={EXAM_TIME_LIMITS[typeof examSize === 'number' ? examSize : 50] || 0}
              examSize={resolvedExamSize}
              examType={examType}
              onRetry={handleRetry}
              onDone={() => navigate('/dashboard')}
            />
          </div>
        )}

        {phase === 'results' && (
          <ExamResults
            results={results}
            timeTaken={timeTaken}
            examSize={resolvedExamSize}
            examType={examType}
            onRetry={handleRetry}
            onDone={() => navigate('/dashboard')}
          />
        )}
      </div>
    </AppLayout>
  )
}
