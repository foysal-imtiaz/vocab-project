import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, BookOpen, RotateCcw, GraduationCap,
  Target, Zap, CheckCircle2, ChevronRight, X,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { useUserStats, useDueWords, useWords } from '@/hooks/useVocab'
import { useAuthStore } from '@/store/authStore'
import { useDebounce } from '@/hooks/useDebounce'
import { getTierInfo } from '@/lib/spacedRepetition'

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

// Inline search dropdown result row
function SearchResultRow({ word, onClick }) {
  const tier = getTierInfo(word.progress?.learning_tier ?? 0)
  return (
    <button
      onClick={() => onClick(word)}
      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{word.english_word}</span>
          {word.part_of_speech && (
            <span className="text-xs text-gray-400 italic">{word.part_of_speech}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{word.bangla_meaning}</p>
      </div>
      <span className={`badge text-xs flex-shrink-0 ${tier.color}`}>{tier.label}</span>
    </button>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: stats, isLoading: statsLoading } = useUserStats()
  const { data: dueWords } = useDueWords()

  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const searchRef = useRef(null)
  const debouncedSearch = useDebounce(search, 300)

  // Fetch search results while typing (only when there's a query)
  const { data: searchData, isFetching: searchFetching } = useWords({
    page: 1,
    pageSize: 6,
    search: debouncedSearch,
  })
  const searchResults = debouncedSearch.trim() ? (searchData?.words || []) : []

  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Open dropdown whenever there's a debounced query
  useEffect(() => {
    if (debouncedSearch.trim()) setDropdownOpen(true)
    else setDropdownOpen(false)
  }, [debouncedSearch])

  const handleWordClick = (word) => {
    setSearch('')
    setDropdownOpen(false)
    // Navigate to vocabulary page and auto-expand this word
    navigate(`/vocabulary?expand=${word.id}`)
  }

  const handleViewAll = () => {
    setDropdownOpen(false)
    navigate(`/vocabulary?search=${encodeURIComponent(debouncedSearch.trim())}`)
  }

  const clearSearch = () => {
    setSearch('')
    setDropdownOpen(false)
  }

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
              : 'Keep up the great work on your vocabulary!'}
          </p>
        </div>

        {/* Search with inline dropdown */}
        <div className="relative" ref={searchRef}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search words in English or বাংলা..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => { if (debouncedSearch.trim()) setDropdownOpen(true) }}
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

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {searchFetching && searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">Searching…</div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">
                  No words found for "{debouncedSearch}"
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100">
                    {searchResults.map((word) => (
                      <SearchResultRow key={word.id} word={word} onClick={handleWordClick} />
                    ))}
                  </div>
                  {searchData?.total > 6 && (
                    <button
                      onClick={handleViewAll}
                      className="w-full px-4 py-2.5 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors border-t border-gray-100 text-left"
                    >
                      View all {searchData.total} results →
                    </button>
                  )}
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
