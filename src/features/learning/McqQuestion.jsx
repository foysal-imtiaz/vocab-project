import { useState, useMemo } from 'react'
import { ArrowRight } from 'lucide-react'
import { buildMcqOptions } from '@/lib/spacedRepetition'

export default function McqQuestion({ word, onAnswer, questionNumber, totalQuestions, isLast }) {
  const [selected, setSelected] = useState(null)

  // Memoized so options never reshuffle between renders — fixes jumping bug
  const { options, correctAnswer } = useMemo(() => buildMcqOptions(word), [word.id])

  const handleNext = () => {
    if (!selected) return
    const isCorrect = selected === correctAnswer
    // Pass answer to parent — no feedback shown here, results revealed at end
    onAnswer({ wordId: word.id, selectedAnswer: selected, correctAnswer, isCorrect })
  }

  const getOptionStyle = (option) =>
    selected === option
      ? 'border-brand-500 bg-brand-50 text-gray-900'
      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${((questionNumber - 1) / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 font-medium flex-shrink-0">
          {questionNumber}/{totalQuestions}
        </span>
      </div>

      {/* Question */}
      <div className="text-center py-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          What is the Bengali meaning of
        </p>
        <h2 className="text-3xl font-display font-bold text-gray-900">{word.english_word}</h2>
        {word.part_of_speech && (
          <p className="text-sm text-gray-400 mt-1.5 italic">{word.part_of_speech}</p>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-2.5">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => setSelected(option)}
            className={`w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium text-left
              transition-colors duration-150 ${getOptionStyle(option)}`}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Next / Submit */}
      <button
        onClick={handleNext}
        disabled={!selected}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLast ? 'Submit Quiz' : 'Next'}
        <ArrowRight size={15} />
      </button>
    </div>
  )
}
