import { ArrowLeft, ArrowRight } from 'lucide-react'

export default function WordStudyCard({ word, onNext, onBack, isLast, isFirst, progress, total }) {
  const examples = Array.isArray(word.example_sentences)
    ? word.example_sentences
    : (word.example_sentences ? [word.example_sentences] : [])

  const synonyms = Array.isArray(word.english_definition_synonyms)
    ? word.english_definition_synonyms
    : (word.english_definition_synonyms
        ? word.english_definition_synonyms.split(',').map((s) => s.trim())
        : [])

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 font-medium flex-shrink-0">
          {progress}/{total}
        </span>
      </div>

      {/* Word card */}
      <div className="card p-6 space-y-5">
        {/* English word */}
        <div className="text-center pb-4 border-b border-gray-100">
          <h2 className="text-3xl font-display font-bold text-gray-900">{word.english_word}</h2>
          {word.part_of_speech && (
            <span className="text-xs text-gray-400 italic mt-1 inline-block">{word.part_of_speech}</span>
          )}
        </div>

        {/* Bangla meaning */}
        <div className="text-center">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Bengali Meaning</p>
          <p className="text-2xl font-semibold text-gray-900">{word.bangla_meaning}</p>
        </div>

        {/* Synonyms */}
        {synonyms.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Definition & Synonyms</p>
            <div className="flex flex-wrap gap-1.5">
              {synonyms.map((syn, i) => (
                <span key={i} className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-md font-medium">
                  {syn}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Examples */}
        {examples.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Examples</p>
            <ul className="space-y-2">
              {examples.map((ex, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-gray-300 flex-shrink-0 mt-0.5">—</span>
                  <p className="text-sm italic text-gray-600 leading-relaxed">{ex}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Difficulty */}
        {word.difficulty_level && (
          <div className="pt-1">
            <span className={`badge text-xs ${
              word.difficulty_level === 1 ? 'bg-green-50 text-green-600' :
              word.difficulty_level === 2 ? 'bg-yellow-50 text-yellow-600' :
              'bg-red-50 text-red-600'
            }`}>
              {word.difficulty_level === 1 ? 'Easy' : word.difficulty_level === 2 ? 'Medium' : 'Hard'}
            </span>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isFirst}
          className="btn-secondary flex items-center justify-center gap-2 py-3 px-5
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <button
          onClick={onNext}
          className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
        >
          {isLast ? 'Start Quiz' : 'Next'}
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}
