import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock, Trophy, CheckCircle2, XCircle,
  ChevronDown, AlertTriangle, GraduationCap, ArrowLeft, ArrowRight,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { useLearnedWords, useRecordAnswer } from '@/hooks/useVocab'
import { buildMcqOptions, EXAM_SIZES, EXAM_TIME_LIMITS, shuffleArray } from '@/lib/spacedRepetition'

/* ── Timer (text only, no bar) ──────────────────────────────────────────── */
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

/* ── Leave warning banner ───────────────────────────────────────────────── */
function LeaveWarning() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
      <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
      <p className="text-xs text-amber-700">Leaving this page will lose your current exam progress.</p>
    </div>
  )
}

/* ── Single MCQ question ────────────────────────────────────────────────── */
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

/* ── Wrong word card (collapsible) ──────────────────────────────────────── */
function WrongWordCard({ result }) {
  const [expanded, setExpanded] = useState(false)
  const word = result.word || {}
  const examples = Array.isArray(word.example_sentences) ? word.example_sentences
    : word.example_sentences ? [word.example_sentences] : []
  const synonyms = Array.isArray(word.english_definition_synonyms) ? word.english_definition_synonyms
    : word.english_definition_synonyms ? word.english_definition_synonyms.split(',').map(s => s.trim()) : []

  const isSkipped = !result.selectedAnswer

  return (
    <div className="border border-red-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left bg-red-50/40 hover:bg-red-50 transition-colors"
      >
        <XCircle size={14} className="text-red-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-900">{word.english_word}</span>
          {word.part_of_speech && <span className="ml-2 text-xs text-gray-400 italic">{word.part_of_speech}</span>}
          <p className="text-xs text-gray-500 mt-0.5">
            Correct: <span className="font-medium text-gray-700">{result.correctAnswer}</span>
            <span className="mx-1.5 text-gray-300">·</span>
            {isSkipped
              ? <span className="text-gray-400 italic">Skipped</span>
              : <><span className="text-red-500">You chose: {result.selectedAnswer}</span></>
            }
          </p>
        </div>
        <ChevronDown size={15} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-4 py-4 space-y-3 border-t border-red-100 bg-white">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Meaning</p>
            <p className="text-sm font-medium text-gray-900">{word.bangla_meaning}</p>
          </div>
          {synonyms.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Synonyms</p>
              <div className="flex flex-wrap gap-1.5">
                {synonyms.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">{s}</span>
                ))}
              </div>
            </div>
          )}
          {examples.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Examples</p>
              {examples.map((ex, i) => (
                <p key={i} className="text-xs italic text-gray-600 leading-relaxed">— {ex}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Results ────────────────────────────────────────────────────────────── */
function ExamResults({ results, timeTaken, examSize, onRetry, onDone }) {
  const answered = results.filter(r => r.selectedAnswer !== null)
  const correct = results.filter(r => r.isCorrect).length
  const wrong = results.filter(r => !r.isCorrect && r.selectedAnswer !== null).length
  const skipped = results.filter(r => r.selectedAnswer === null).length

  // Score: correct - (wrong × 0.25), skipped = 0. Min 0.
  const rawScore = Math.max(0, correct - wrong * 0.25)
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
        <p className="text-sm text-gray-400 mb-5">Exam complete · {examSize} questions</p>

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

        {/* Scoring explanation */}
        <div className="mt-4 px-3 py-2.5 bg-gray-50 rounded-lg text-left space-y-1">
          <p className="text-xs font-semibold text-gray-600">Scoring method</p>
          <p className="text-xs text-gray-500">
            +1 per correct · −0.25 per wrong · 0 for skipped
          </p>
          <p className="text-xs text-gray-500">
            Raw: {correct} − ({wrong} × 0.25) = <span className="font-semibold text-gray-700">{rawScore.toFixed(2)}</span> / {results.length}
          </p>
          <p className="text-xs text-gray-500">
            Time used: {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </p>
        </div>
      </div>

      {correct > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">✓ Correct ({correct})</p>
          <div className="card divide-y divide-gray-100">
            {results.filter(r => r.isCorrect).map((r, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center gap-2.5">
                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900">{r.word?.english_word}</span>
                <span className="text-xs text-gray-400 ml-auto">{r.correctAnswer}</span>
              </div>
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
            {wrongResults.map((r, i) => <WrongWordCard key={i} result={r} />)}
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

/* ── Main ExamPage ───────────────────────────────────────────────────────── */
export default function ExamPage() {
  const navigate = useNavigate()
  const { data: allLearnedWords = [], isLoading } = useLearnedWords()
  const recordAnswer = useRecordAnswer()

  const [phase, setPhase] = useState('setup')
  const [examSize, setExamSize] = useState(20)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})   // wordId → selected option or null
  const [results, setResults] = useState([])
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [timeTaken, setTimeTaken] = useState(0)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  const availableCount = allLearnedWords.length
  const availableSizes = EXAM_SIZES.filter(s => s <= availableCount)
  const canStart = availableCount >= 20

  useEffect(() => {
    if (availableSizes.length > 0) setExamSize(availableSizes[0])
  }, [availableCount])

  // Warn on browser back/refresh while exam is active
  useEffect(() => {
    if (phase !== 'exam') return
    const handler = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [phase])

  const startExam = () => {
    const shuffled = shuffleArray(allLearnedWords).slice(0, examSize)
    setQuestions(shuffled)
    setCurrentIndex(0)
    // initialise all answers as null (unanswered)
    const initial = {}
    shuffled.forEach(w => { initial[w.id] = null })
    setAnswers(initial)
    setResults([])
    setSecondsLeft(EXAM_TIME_LIMITS[examSize])
    startTimeRef.current = Date.now()
    setPhase('exam')
  }

  // Countdown timer
  useEffect(() => {
    if (phase !== 'exam') { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current)
          handleTimeUp()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  const handleTimeUp = useCallback(() => {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
    setTimeTaken(elapsed)
    submitExam(answers, elapsed, true)
  }, [answers, questions])

  const handleSelectAnswer = (option) => {
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: option }))
  }

  const handleBack = () => {
    setCurrentIndex(i => Math.max(0, i - 1))
  }

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
      const selected = finalAnswers[word.id]   // null = unanswered/skipped
      const correct = word.bangla_meaning
      const isCorrect = selected !== null && selected === correct

      // Only record answered questions (skipped = no DB entry, no penalty)
      if (selected !== null) {
        recordAnswer.mutate({
          wordId: word.id,
          selectedAnswer: selected,
          correctAnswer: correct,
          isCorrect,
        })
      }

      return {
        wordId: word.id,
        word,
        selectedAnswer: selected,   // null means skipped
        correctAnswer: correct,
        isCorrect,
      }
    })
    setResults(built)
    setPhase(timedOut ? 'timeout' : 'results')
  }

  const handleRetry = () => {
    clearInterval(timerRef.current)
    setPhase('setup')
  }

  const currentWord = questions[currentIndex]
  const selectedForCurrent = currentWord ? answers[currentWord.id] : null
  const totalSeconds = EXAM_TIME_LIMITS[examSize] || EXAM_TIME_LIMITS[20]
  const answeredCount = Object.values(answers).filter(v => v !== null).length

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto">

        {/* ── Setup ── */}
        {phase === 'setup' && (
          <div className="animate-fade-in space-y-8">
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900">Vocabulary Exam</h1>
              <p className="text-sm text-gray-500 mt-1">
                Test yourself on your Learned and Advanced words under timed conditions
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
            ) : !canStart ? (
              <div className="card p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto">
                  <GraduationCap size={24} className="text-orange-500" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Not enough words yet</h2>
                <p className="text-sm text-gray-500">
                  You need at least <span className="font-semibold">20 Learned or Advanced words</span> to take an exam.
                  You currently have <span className="font-semibold">{availableCount}</span>.
                </p>
                <button onClick={() => navigate('/learn')} className="btn-primary px-6 py-2.5 mt-1">
                  Go to Learn
                </button>
              </div>
            ) : (
              <div className="card p-6 space-y-6">
                <div className="flex items-center gap-3 px-3 py-2.5 bg-brand-50 rounded-lg">
                  <GraduationCap size={16} className="text-brand-600 flex-shrink-0" />
                  <p className="text-sm text-brand-700">
                    <span className="font-semibold">{availableCount}</span> words available (Learned + Advanced)
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Number of questions</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {EXAM_SIZES.map(size => {
                      const isAvailable = size <= availableCount
                      return (
                        <button
                          key={size}
                          onClick={() => isAvailable && setExamSize(size)}
                          disabled={!isAvailable}
                          className={`py-3 rounded-lg border-2 text-center transition-colors ${
                            examSize === size && isAvailable
                              ? 'border-brand-500 bg-brand-50'
                              : isAvailable
                                ? 'border-gray-200 hover:border-gray-300'
                                : 'border-gray-100 opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <p className={`text-sm font-semibold ${examSize === size && isAvailable ? 'text-brand-700' : 'text-gray-700'}`}>
                            {size} words
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{EXAM_TIME_LIMITS[size] / 60} min</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 border-t border-gray-100 pt-4">
                  {[
                    'Questions randomly selected from your Learned & Advanced words',
                    'No feedback during the exam — results shown at the end',
                    `Scoring: +1 correct, −0.25 wrong, 0 for skipped`,
                    `Time limit: ${EXAM_TIME_LIMITS[examSize] / 60} minutes`,
                  ].map((rule, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>

                <button onClick={startExam} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  <Clock size={15} />
                  Start Exam — {examSize} questions
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Exam ── */}
        {phase === 'exam' && currentWord && (
          <div className="space-y-4">
            {/* Header row: timer + progress + leave warning */}
            <div className="flex items-center justify-between">
              <Timer secondsLeft={secondsLeft} />
              <span className="text-sm text-gray-500 font-medium">
                {currentIndex + 1} / {questions.length}
                {answeredCount > 0 && (
                  <span className="ml-2 text-xs text-gray-400">({answeredCount} answered)</span>
                )}
              </span>
            </div>

            <LeaveWarning />

            <ExamQuestion
              word={currentWord}
              selected={selectedForCurrent}
              onSelect={handleSelectAnswer}
            />

            {/* Back + Next buttons */}
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
              <button
                onClick={handleNext}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
              >
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

        {/* ── Time up ── */}
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
              timeTaken={EXAM_TIME_LIMITS[examSize]}
              examSize={examSize}
              onRetry={handleRetry}
              onDone={() => navigate('/dashboard')}
            />
          </div>
        )}

        {phase === 'results' && (
          <ExamResults
            results={results}
            timeTaken={timeTaken}
            examSize={examSize}
            onRetry={handleRetry}
            onDone={() => navigate('/dashboard')}
          />
        )}
      </div>
    </AppLayout>
  )
}
