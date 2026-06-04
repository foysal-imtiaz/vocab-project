import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, BookOpen, RotateCcw, GraduationCap,
  Target, Zap, CheckCircle2, ChevronRight, X, ChevronDown,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { useUserStats, useDueWords } from '@/hooks/useVocab'
import { useAuthStore } from '@/store/authStore'
import { useDebounce } from '@/hooks/useDebounce'
import { getTierInfo } from '@/lib/spacedRepetition'
import { supabase } from '@/lib/supabase'

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-current" />
        </div>
      </div>
      <p className="text-2xl font-display font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

// Collapsible word row — same pattern as homepage but includes tier badge
function WordRow({ word }) {
  const [expanded, setExpanded] = useState(false)
  const tier = getTierInfo(word.progress?.learning_tier ?? 0)

  const examples = Array.isArray(word.example_sentences)
    ? word.example_sentences
    : word.example_sentences ? [word.example_sentences] : []

  const synonyms = Array.isArray(word.english_definition_synonyms)
    ? word.english_definition_synonyms
    : word.english_definition_synonyms
        ? word.english_definition_synonyms.split(',').map(s => s.trim())
        : []

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{word.english_word}</span>
            {word.part_of_speech && (
              <span className="text-xs text-gray-400 italic hidden sm:inline">{word.part_of_speech}</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{word.bangla_meaning}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`badge text-xs ${tier.color}`}>{tier.label}</span>
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-gray-50/60">
          {synonyms.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                Definition & Synonyms
              </p>
              <div className="flex flex-wrap gap-1.5">
                {synonyms.map((syn, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-700"
                  >
                    {syn}
                  </span>
                ))}
              </div>
            </div>
          )}
          {examples.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Examples</p>
              <ul className="space-y-1">
                {examples.map((ex, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-gray-300 flex-shrink-0">—</span>
                    <p className="text-xs italic text-gray-600 leading-relaxed">{ex}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!synonyms.length && !examples.length && (
            <p className="text-xs text-gray-400 italic">No additional details.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: stats, isLoading: statsLoading } = useUserStats()
  const { data: dueWords } = useDueWords()

  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Search words with progress via Supabase directly
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    supabase
      .from('words')
      .select(`
        *,
        user_progress!left(
          id, learning_tier, mastery_score,
          last_reviewed_at, next_review_date,
          total_correct, total_wrong
        )
      `)
      .eq('user_progress.user_id', user.id)
      .or(`english_word.ilike.%${debouncedSearch.trim()}%,bangla_meaning.ilike.%${debouncedSearch.trim()}%`)
      .order('english_word', { ascending: true })
      .limit(20)
      .then(({ data, error }) => {
        if (!error) {
          setSearchResults(
            (data || []).map(w => ({
              ...w,
              progress: w.user_progress?.[0] || null,
              user_progress: undefined,
            }))
          )
        }
      })
      .finally(() => setSearching(false))
  }, [debouncedSearch, user?.id])

  const clearSearch = () => {
    setSearch('')
    setSearchResults([])
  }

  const showResults = debouncedSearch.trim().length > 0

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            {greeting}, {name} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {dueWords?.length
              ? `You have ${dueWords.length} word${dueWords.length === 1 ? '' : 's'} due for review today.`
              : 'Keep up the great work on your vocabulary learning!'}
          </p>
        </div>

        {/* Search + inline results */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search words in English or বাংলা..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9 pr-9 py-2.5 text-sm"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Inline collapsible results — shown below search bar */}
          {showResults && (
            <div className="card overflow-hidden">
              {searching ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="px-4 py-3 border-b border-gray-100 last:border-0 animate-pulse flex items-center gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-28 bg-gray-100 rounded" />
                      <div className="h-3 w-20 bg-gray-100 rounded" />
                    </div>
                    <div className="h-5 w-14 bg-gray-100 rounded" />
                  </div>
                ))
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-4 text-sm text-gray-400">
                  No words found for "{debouncedSearch}"
                </div>
              ) : (
                <>
                  {searchResults.map(word => (
                    <WordRow key={word.id} word={word} />
                  ))}
                  <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-400">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
                    <button
                      onClick={() => navigate(`/vocabulary?search=${encodeURIComponent(debouncedSearch.trim())}`)}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      Browse full list →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/learn')}
            className="card p-4 text-left hover:border-brand-200 hover:shadow-sm transition-all duration-150 group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                <GraduationCap size={16} className="text-brand-600" />
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-400 ml-auto transition-colors" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Start Learning</p>
            <p className="text-xs text-gray-500 mt-0.5">Study a new batch of words</p>
          </button>

          <button
            onClick={() => navigate('/review')}
            className="card p-4 text-left hover:border-orange-200 hover:shadow-sm transition-all duration-150 group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <RotateCcw size={16} className="text-orange-600" />
              </div>
              {dueWords?.length > 0 ? (
                <span className="ml-auto text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  {dueWords.length} due
                </span>
              ) : (
                <ChevronRight size={14} className="text-gray-300 group-hover:text-orange-400 ml-auto transition-colors" />
              )}
            </div>
            <p className="text-sm font-semibold text-gray-900">Today's Review</p>
            <p className="text-xs text-gray-500 mt-0.5">Spaced repetition queue</p>
          </button>

          <button
            onClick={() => navigate('/vocabulary')}
            className="card p-4 text-left hover:border-gray-300 hover:shadow-sm transition-all duration-150 group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <BookOpen size={16} className="text-gray-600" />
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 ml-auto transition-colors" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Vocabulary List</p>
            <p className="text-xs text-gray-500 mt-0.5">Browse all words</p>
          </button>
        </div>

        {/* Stats */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Your Progress</h2>
          {statsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg mb-3" />
                  <div className="h-7 w-12 bg-gray-100 rounded mb-1" />
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={BookOpen}
                label="Words Started"
                value={stats?.wordsStarted || 0}
                color="bg-blue-50 text-blue-600"
              />
              <StatCard
                icon={CheckCircle2}
                label="Mastered"
                value={stats?.mastered || 0}
                color="bg-green-50 text-green-600"
              />
              <StatCard
                icon={Zap}
                label="In Progress"
                value={stats?.learning || 0}
                color="bg-yellow-50 text-yellow-600"
              />
              <StatCard
                icon={Target}
                label="Accuracy"
                value={stats?.accuracy ? `${stats.accuracy}%` : '—'}
                color="bg-brand-50 text-brand-600"
                sub={stats?.totalAttempts ? `${stats.totalAttempts} attempts` : 'No attempts yet'}
              />
            </div>
          )}
        </div>

        {/* Due words preview */}
        {dueWords?.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Due for Review</h2>
              <button
                onClick={() => navigate('/review')}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                View all →
              </button>
            </div>
            <div className="card divide-y divide-gray-100">
              {dueWords.slice(0, 5).map((word) => (
                <div key={word.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{word.english_word}</span>
                    <span className="text-sm text-gray-400 mx-1.5">·</span>
                    <span className="text-sm text-gray-500">{word.bangla_meaning}</span>
                  </div>
                  <span className="badge bg-orange-50 text-orange-600 text-xs">Due</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
