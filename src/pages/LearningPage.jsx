import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, BookOpen } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import WordStudyCard from '@/features/learning/WordStudyCard'
import McqQuestion from '@/features/learning/McqQuestion'
import SessionResults from '@/features/learning/SessionResults'
import { useRecordAnswer, useCreateSession, useCompleteSession } from '@/hooks/useVocab'
import { fetchNewWords } from '@/services/wordsService'
import { markWordAsLearned } from '@/services/progressService'
import { useAuthStore } from '@/store/authStore'

const BATCH_OPTIONS = [
  { value: 10, label: '10 words' },
  { value: 20, label: '20 words' },
  { value: 30, label: '30 words' },
]

function SetupScreen({ onStart }) {
  const [batchSize, setBatchSize] = useState(10)
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Learning Session</h1>
        <p className="text-sm text-gray-500 mt-1">Study new vocabulary, then test yourself with MCQs</p>
      </div>
      <div className="card p-6 space-y-6">
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">How it works</p>
          <div className="space-y-2.5">
            {[
              { step: '1', text: 'Study each word — use Back and Next to move freely' },
              { step: '2', text: 'Words become Learned and appear in Review the next day' },
              { step: '3', text: 'Answer correctly in Review → Advanced, then Mastered' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {item.step}
                </span>
                <p className="text-sm text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Batch size</p>
          <div className="grid grid-cols-3 gap-2">
            {BATCH_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setBatchSize(value)}
                className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                  batchSize === value
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => onStart(batchSize)}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          <GraduationCap size={16} />
          Start Session
        </button>
      </div>
    </div>
  )
}

function NoWordsScreen({ onGoReview }) {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto">
        <BookOpen size={24} className="text-green-600" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">All caught up!</h2>
        <p className="text-sm text-gray-500 mt-1">
          You've started learning all available words. Check your review queue instead.
        </p>
      </div>
      <button onClick={onGoReview} className="btn-primary px-6 py-2.5">
        Go to Review Queue
      </button>
    </div>
  )
}

export default function LearningPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [phase, setPhase] = useState('setup')
  const [words, setWords] = useState([])
  const [studyIndex, setStudyIndex] = useState(0)
  const [mcqIndex, setMcqIndex] = useState(0)
  const [mcqResults, setMcqResults] = useState([])
  const [sessionId, setSessionId] = useState(null)

  const recordAnswer = useRecordAnswer()
  const createSession = useCreateSession()
  const completeSession = useCompleteSession()

  const handleStart = async (size) => {
    setPhase('loading')
    try {
      const fetched = await fetchNewWords(user.id, size)
      if (!fetched || fetched.length === 0) {
        setPhase('no-words')
        return
      }
      const session = await createSession.mutateAsync()
      setSessionId(session.id)
      setWords(fetched)
      setStudyIndex(0)
      setMcqIndex(0)
      setMcqResults([])
      setPhase('studying')
    } catch (err) {
      console.error(err)
      setPhase('setup')
    }
  }

  const handleStudyNext = async () => {
    // Mark current word as Learned (tier 1) — review tomorrow
    const currentWord = words[studyIndex]
    if (currentWord) {
      markWordAsLearned(user.id, currentWord.id).catch(console.error)
    }
    if (studyIndex + 1 >= words.length) {
      setPhase('mcq')
    } else {
      setStudyIndex((i) => i + 1)
    }
  }

  const handleStudyBack = () => {
    setStudyIndex((i) => Math.max(0, i - 1))
  }

  const handleMcqAnswer = ({ wordId, selectedAnswer, correctAnswer, isCorrect }) => {
    const newResults = [
      ...mcqResults,
      { wordId, selectedAnswer, correctAnswer, isCorrect, word: words[mcqIndex] },
    ]
    setMcqResults(newResults)
    recordAnswer.mutate({ wordId, selectedAnswer, correctAnswer, isCorrect })

    if (mcqIndex + 1 >= words.length) {
      if (sessionId) completeSession.mutate({ sessionId, wordsStudied: words.length })
      setPhase('results')
    } else {
      setMcqIndex((i) => i + 1)
    }
  }

  const handleRestart = () => {
    setPhase('setup')
    setWords([])
    setStudyIndex(0)
    setMcqIndex(0)
    setMcqResults([])
    setSessionId(null)
  }

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto">
        {phase === 'setup' && <SetupScreen onStart={handleStart} />}

        {phase === 'loading' && (
          <div className="flex items-center justify-center py-24">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {phase === 'no-words' && (
          <NoWordsScreen onGoReview={() => navigate('/review')} />
        )}

        {phase === 'studying' && words[studyIndex] && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-6">Study Mode</p>
            <WordStudyCard
              word={words[studyIndex]}
              onNext={handleStudyNext}
              onBack={handleStudyBack}
              isFirst={studyIndex === 0}
              isLast={studyIndex + 1 >= words.length}
              progress={studyIndex + 1}
              total={words.length}
            />
          </div>
        )}

        {phase === 'mcq' && words[mcqIndex] && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-6">Quiz Time</p>
            <McqQuestion
              key={words[mcqIndex].id}
              word={words[mcqIndex]}
              onAnswer={handleMcqAnswer}
              questionNumber={mcqIndex + 1}
              totalQuestions={words.length}
              isLast={mcqIndex + 1 >= words.length}
            />
          </div>
        )}

        {phase === 'results' && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-6">Results</p>
            <SessionResults results={mcqResults} onRestart={handleRestart} />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
