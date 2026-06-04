import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { getTierInfo } from '@/lib/spacedRepetition'

function PartOfSpeechBadge({ pos }) {
  const colors = {
    noun: 'bg-blue-50 text-blue-600',
    verb: 'bg-purple-50 text-purple-600',
    adjective: 'bg-pink-50 text-pink-600',
    adverb: 'bg-teal-50 text-teal-600',
    preposition: 'bg-orange-50 text-orange-600',
    conjunction: 'bg-yellow-50 text-yellow-600',
    default: 'bg-gray-100 text-gray-600',
  }
  const colorClass = colors[pos?.toLowerCase()] || colors.default
  return (
    <span className={`badge ${colorClass} text-xs font-medium`}>
      {pos}
    </span>
  )
}

export default function WordCard({ word, showProgress = true, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const progress = word.progress
  const tierInfo = getTierInfo(progress?.learning_tier ?? 0)

  const examples = Array.isArray(word.example_sentences)
    ? word.example_sentences
    : (word.example_sentences ? [word.example_sentences] : [])

  const synonyms = Array.isArray(word.english_definition_synonyms)
    ? word.english_definition_synonyms
    : (word.english_definition_synonyms
        ? word.english_definition_synonyms.split(',').map((s) => s.trim())
        : [])

  return (
    <div className="card overflow-hidden transition-shadow duration-150 hover:shadow-sm">
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-gray-900">
              {word.english_word}
            </span>
            {word.part_of_speech && (
              <PartOfSpeechBadge pos={word.part_of_speech} />
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5 truncate">
            {word.bangla_meaning}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {showProgress && (
            <span className={`badge text-xs ${tierInfo.color}`}>
              {tierInfo.label}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4 animate-slide-down">
          {/* Bangla meaning prominent */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Meaning</p>
            <p className="text-base font-medium text-gray-900">{word.bangla_meaning}</p>
          </div>

          {/* Synonyms / Definition */}
          {synonyms.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Definition & Synonyms
              </p>
              <div className="flex flex-wrap gap-1.5">
                {synonyms.map((syn, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-700 font-medium"
                  >
                    {syn}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Example sentences */}
          {examples.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Examples
              </p>
              <ul className="space-y-2">
                {examples.map((ex, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-gray-300 text-sm mt-0.5 flex-shrink-0">—</span>
                    <p className="text-sm italic text-gray-600 leading-relaxed">{ex}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Difficulty + Progress */}
          <div className="flex items-center gap-3 pt-1">
            {word.difficulty_level && (
              <span className={`badge text-xs ${
                word.difficulty_level === 1 ? 'bg-green-50 text-green-600' :
                word.difficulty_level === 2 ? 'bg-yellow-50 text-yellow-600' :
                'bg-red-50 text-red-600'
              }`}>
                {word.difficulty_level === 1 ? 'Easy' : word.difficulty_level === 2 ? 'Medium' : 'Hard'}
              </span>
            )}
            {showProgress && progress && (
              <>
                <span className={`badge text-xs ${tierInfo.color} flex items-center gap-1`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${tierInfo.dot}`} />
                  {tierInfo.label}
                </span>
                {progress.mastery_score !== undefined && (
                  <span className="text-xs text-gray-400">
                    {progress.mastery_score}% accuracy
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
