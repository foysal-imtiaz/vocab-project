import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, RotateCcw, Home, CheckCircle2, XCircle, ChevronDown } from 'lucide-react'

// Inline mini word card for wrong answers — no progress badges needed
function WrongWordCard({ result }) {
  const [expanded, setExpanded] = useState(false)
  const word = result.word || {}

  const examples = Array.isArray(word.example_sentences)
    ? word.example_sentences
    : word.example_sentences ? [word.example_sentences] : []

  const synonyms = Array.isArray(word.english_definition_synonyms)
    ? word.english_definition_synonyms
    : word.english_definition_synonyms
        ? word.english_definition_synonyms.split(',').map((s) => s.trim())
        : []

  return (
    <div className="border border-red-100 rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left bg-red-50/40 hover:bg-red-50 transition-colors"
      >
        <XCircle size={14} className="text-red-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-900">{word.english_word}</span>
          {word.part_of_speech && (
            <span className="ml-2 text-xs text-gray-400 italic">{word.part_of_speech}</span>
          )}
          <p className="text-xs text-gray-500 mt-0.5">
            Correct: <span className="font-medium text-gray-700">{result.correctAnswer}</span>
            <span className="mx-1.5 text-gray-300">·</span>
            You chose: <span className="text-red-500">{result.selectedAnswer}</span>
          </p>
        </div>
        <ChevronDown
          size={15}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 py-4 space-y-3 border-t border-red-100 bg-white">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Meaning</p>
            <p className="text-sm font-medium text-gray-900">{word.bangla_meaning}</p>
          </div>

          {synonyms.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Definition & Synonyms</p>
              <div className="flex flex-wrap gap-1.5">
                {synonyms.map((syn, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">
                    {syn}
                  </span>
                ))}
              </div>
            </div>
          )}

          {examples.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Examples</p>
              <ul className="space-y-1.5">
                {examples.map((ex, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-gray-300 flex-shrink-0">—</span>
                    <p className="text-xs italic text-gray-600 leading-relaxed">{ex}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SessionResults({ results, onRestart }) {
  const navigate = useNavigate()
  const correct = results.filter((r) => r.isCorrect).length
  const wrong = results.length - correct
  const score = results.length ? Math.round((correct / results.length) * 100) : 0
  const wrongResults = results.filter((r) => !r.isCorrect)

  const getMessage = () => {
    if (score === 100) return { text: 'Perfect score! 🎉', sub: 'Incredible — you nailed every word.' }
    if (score >= 80)  return { text: 'Great job! 🌟',     sub: "You're making excellent progress." }
    if (score >= 60)  return { text: 'Good effort! 💪',   sub: 'Review the words below to strengthen your memory.' }
    return             { text: 'Keep going! 📚',           sub: 'Study the missed words below — they\'ll come back for review soon.' }
  }

  const msg = getMessage()

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Score card */}
      <div className="card p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <Trophy size={28} className="text-brand-600" />
        </div>
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">{msg.text}</h2>
        <p className="text-sm text-gray-500 mb-5">{msg.sub}</p>

        <div className="flex items-center justify-center gap-8 py-4 border-t border-b border-gray-100">
          <div className="text-center">
            <p className="text-3xl font-display font-bold text-gray-900">{score}%</p>
            <p className="text-xs text-gray-500 mt-0.5">Score</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-display font-bold text-green-600">{correct}</p>
            <p className="text-xs text-gray-500 mt-0.5">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-display font-bold text-red-500">{wrong}</p>
            <p className="text-xs text-gray-500 mt-0.5">Wrong</p>
          </div>
        </div>
      </div>

      {/* Correct answers — compact list */}
      {correct > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            ✓ Correct ({correct})
          </p>
          <div className="card divide-y divide-gray-100">
            {results.filter((r) => r.isCorrect).map((r, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center gap-2.5">
                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900">{r.word?.english_word || '—'}</span>
                <span className="text-xs text-gray-400 ml-auto">{r.correctAnswer}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wrong answers — collapsible word cards to study */}
      {wrongResults.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            ✗ Needs Review ({wrong}) — tap to study
          </p>
          <div className="space-y-2">
            {wrongResults.map((r, i) => (
              <WrongWordCard key={i} result={r} />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pb-4">
        <button
          onClick={onRestart}
          className="btn-secondary flex-1 flex items-center justify-center gap-2 py-2.5"
        >
          <RotateCcw size={14} />
          Learn More
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5"
        >
          <Home size={14} />
          Dashboard
        </button>
      </div>
    </div>
  )
}
