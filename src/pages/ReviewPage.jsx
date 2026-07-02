import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RotateCcw, CheckCircle2, Clock, Trophy, BookOpen,
  ArrowRight, Brain, Calendar, ChevronDown, ChevronUp,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import McqQuestion from '@/features/learning/McqQuestion'
import SessionResults from '@/features/learning/SessionResults'
import { useDueWords, useRecordAnswer } from '@/hooks/useVocab'
import { getTierInfo, TIER_INTERVALS } from '@/lib/spacedRepetition'

// Format a date as "Mon, 5 Jan" or "Today" / "Tomorrow"
function formatDate(isoString) {
  if (!isoString) return '—'
  const date = new Date(isoString)
  const today = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  date.setHours(0,0,0,0)
  if (date.getTime() === today.getTime()) return 'Today'
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function DueWordRow({ word }) {
  const tier = getTierInfo(word.progress?.learning_tier ?? 0)
  const daysOverdue = word.progress?.next_review_date
    ? Math.floor((Date.now() - new Date(word.progress.next_review_date)) / 86400000)
    : 0
  const isOverdue = daysOverdue > 0

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{word.english_word}</p>
        <p className="text-xs text-gray-500 mt-0.5">{word.bangla_meaning}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`badge text-xs ${tier.color}`}>{tier.label}</span>
        {isOverdue && (
          <span className="badge text-xs bg-red-50 text-red-500">
            {daysOverdue}d overdue
          </span>
        )}
      </div>
    </div>
  )
}

// popup for explaining spaced repetition
function RepetitionExplainer() {
  const [open, setOpen] = useState(false)

  const tiers = [
    { label: 'New',      color: 'bg-gray-100 text-gray-600',    days: null, desc: 'Word studied — review scheduled for tomorrow' },
    { label: 'Learned',  color: 'bg-orange-50 text-orange-600', days: 1,    desc: 'Review next day — correct → Advanced' },
    { label: 'Advanced', color: 'bg-blue-50 text-blue-600',     days: 3,    desc: 'Review in 3 days — correct → Mastered' },
    { label: 'Mastered', color: 'bg-green-50 text-green-600',   days: null, desc: 'Never reviewed again — permanently done' },
  ]

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3.5 flex items-center gap-2.5 text-left hover:bg-gray-50 transition-colors"
      >
        <Brain size={15} className="text-brand-600 flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-800 flex-1">How spaced repetition works</span>
        {open
          ? <ChevronUp size={15} className="text-gray-400" />
          : <ChevronDown size={15} className="text-gray-400" />
        }
      </button>

      {open && (
        <div className="px-4 pb-5 space-y-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed pt-3">
            Every time you answer a word <span className="font-medium text-gray-800">correctly</span>,
            it moves up a tier and comes back later. The longer you go without forgetting it,
            the less often you need to see it. This is how long-term memory is built.
          </p>

          {/* Tier progression */}
          <div className="space-y-1.5">
            {tiers.map((tier, i) => (
              <div key={tier.label} className="flex items-center gap-2.5">
                <span className={`badge text-xs w-[5.5rem] justify-center flex-shrink-0 ${tier.color}`}>
                  {tier.label}
                </span>
                {i < tiers.length - 1 && (
                  <ArrowRight size={11} className="text-gray-300 flex-shrink-0" />
                )}
                {i === tiers.length - 1 && (
                  <span className="w-[13px]" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-500">{tier.desc}</span>
                  {tier.days && (
                    <span className="text-xs text-gray-400 ml-2">
                      · returns in <span className="font-medium text-gray-600">{tier.days} days</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Wrong answer rule */}
          <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 space-y-1">
            <p className="text-xs font-semibold text-red-700">If you answer incorrectly</p>
            <p className="text-xs text-red-600 leading-relaxed">
              The word stays at its current tier (<span className="font-semibold">Learned</span> or <span className="font-semibold">Advanced</span>) and returns on the same schedule — Learned returns tomorrow, Advanced in 3 days.
            </p>
          </div>

          {/* Why it works */}
          <div className="bg-brand-50 border border-brand-100 rounded-lg px-3 py-2.5">
            <p className="text-xs font-semibold text-brand-700 mb-1">Why this works</p>
            <p className="text-xs text-brand-600 leading-relaxed">
              Reviewing a word just before you'd forget it strengthens the memory more than
              reviewing it repeatedly in one session. Once a word reaches <span className="font-semibold">Mastered</span>,
              it leaves the review queue permanently — so you only spend time on what actually needs attention.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// empty state when no words to review
function AllClearScreen({ onLearn }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Review Queue</h1>
        <p className="text-sm text-gray-500 mt-1">Words scheduled for review based on spaced repetition</p>
      </div>

      <div className="card p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
          <Trophy size={24} className="text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">You're all caught up!</h2>
        <p className="text-sm text-gray-500">
          No words are due right now. Your next batch will appear automatically when it's time.
        </p>
      </div>

      <RepetitionExplainer />

      <div className="card p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-800">What to do now</p>
        <ul className="space-y-2.5 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
            <span>
              <span className="font-medium text-gray-800">Learn new words</span> — add fresh vocabulary to your schedule so there's always something to review.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
            <span>
              <span className="font-medium text-gray-800">Come back in 3 days</span> — any Learned words will appear here automatically. Mastered words are done for good.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
            <span>
              <span className="font-medium text-gray-800">Browse vocabulary</span> — read through words at your own pace without affecting your schedule.
            </span>
          </li>
        </ul>
        <button
          onClick={onLearn}
          className="btn-primary w-full py-2.5 mt-1 flex items-center justify-center gap-2"
        >
          <BookOpen size={15} />
          Learn New Words
        </button>
      </div>
    </div>
  )
}

// main component
export default function ReviewPage() {
  const navigate = useNavigate()
  const { data: dueWords = [], isLoading, refetch } = useDueWords()
  const recordAnswer = useRecordAnswer()

  const [phase, setPhase] = useState('queue') // queue | reviewing | results
  const [sessionWords, setSessionWords] = useState([]) // snapshot at session start
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState([])

  // Leave warning while reviewing
  useEffect(() => {
    if (phase !== 'reviewing') return
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [phase])

  const overdueCount = dueWords.filter(w => {
    const date = w.progress?.next_review_date
    return date && new Date(date) < new Date(Date.now() - 86400000)
  }).length

  // Next review date: the earliest next_review_date among all progress entries not yet due
  const handleStartReview = () => {
    setSessionWords([...dueWords]) // snapshot — insulates session from refetch flashes
    setCurrentIndex(0)
    setResults([])
    setPhase('reviewing')
  }

  const handleMcqAnswer = ({ wordId, selectedAnswer, correctAnswer, isCorrect }) => {
    const newResults = [
      ...results,
      { wordId, selectedAnswer, correctAnswer, isCorrect, word: sessionWords[currentIndex] },
    ]
    setResults(newResults)
    recordAnswer.mutate({ wordId, selectedAnswer, correctAnswer, isCorrect })

    if (currentIndex + 1 >= sessionWords.length) {
      setPhase('results')
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  const handleRestart = async () => {
    await refetch()
    setPhase('queue')
    setCurrentIndex(0)
    setResults([])
  }

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto">

        {/* queue view */}
        {phase === 'queue' && (
          <>
            {isLoading ? (
              <div className="space-y-4 animate-fade-in">
                <div className="h-8 w-40 bg-gray-100 rounded animate-pulse" />
                <div className="card divide-y divide-gray-100">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse">
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-28 bg-gray-100 rounded" />
                        <div className="h-3 w-20 bg-gray-100 rounded" />
                      </div>
                      <div className="h-5 w-16 bg-gray-100 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ) : dueWords.length === 0 ? (
              <AllClearScreen onLearn={() => navigate('/learn')} />
            ) : (
              <div className="animate-fade-in space-y-5">
                <div>
                  <h1 className="text-2xl font-display font-bold text-gray-900">Review Queue</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Words scheduled for review based on spaced repetition
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="card p-3.5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <Clock size={14} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-lg font-display font-bold text-gray-900 leading-none">{dueWords.length}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Due now</p>
                    </div>
                  </div>
                  <div className="card p-3.5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <Calendar size={14} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-lg font-display font-bold text-gray-900 leading-none">{overdueCount}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Overdue</p>
                    </div>
                  </div>
                  <div className="card p-3.5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={14} className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-lg font-display font-bold text-gray-900 leading-none">
                        ~{Math.ceil(dueWords.length * 0.5)}m
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Est. time</p>
                    </div>
                  </div>
                </div>

                {/* Word list with next review dates */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-500">
                      {dueWords.length} word{dueWords.length !== 1 ? 's' : ''} to review
                    </p>
                    <p className="text-xs text-gray-400">After correct → next due date</p>
                  </div>
                  <div className="card divide-y divide-gray-100">
                    {dueWords.map((word) => {
                      const currentTier = word.progress?.learning_tier ?? 0
                      const afterCorrect = Math.min(currentTier + 1, 3)
                      const isMastering = afterCorrect === 3

                      return (
                        <div key={word.id} className="px-4 py-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">{word.english_word}</p>
                              <span className={`badge text-xs ${getTierInfo(currentTier).color}`}>
                                {getTierInfo(currentTier).label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{word.bangla_meaning}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-xs font-medium ${isMastering ? 'text-green-600' : 'text-gray-500'}`}>
                              {isMastering ? '→ Mastered ✓' : `→ ${getTierInfo(afterCorrect).label}`}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">if correct</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <RepetitionExplainer />

                <button
                  onClick={handleStartReview}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={15} />
                  Start Review ({dueWords.length} words)
                </button>
              </div>
            )}
          </>
        )}

        {/* mcq review */}
        {phase === 'reviewing' && sessionWords[currentIndex] && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Review Mode</p>
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                ⚠ Leaving will lose progress
              </span>
            </div>
            <div className="mb-6" />
            <McqQuestion
              key={sessionWords[currentIndex].id}
              word={sessionWords[currentIndex]}
              onAnswer={handleMcqAnswer}
              questionNumber={currentIndex + 1}
              totalQuestions={sessionWords.length}
              isLast={currentIndex + 1 >= sessionWords.length}
            />
          </div>
        )}

        {/* results */}
        {phase === 'results' && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-6">Review Complete</p>
            <SessionResults results={results} onRestart={handleRestart} />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
