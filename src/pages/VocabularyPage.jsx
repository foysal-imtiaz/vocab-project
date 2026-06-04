import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Filter, ChevronLeft, ChevronRight, X, LogIn } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import WordCard from '@/features/words/WordCard'
import { useWords } from '@/hooks/useVocab'
import { useAuthStore } from '@/store/authStore'
import { useDebounce } from '@/hooks/useDebounce'

const DIFFICULTIES = [
  { value: '', label: 'All Levels' },
  { value: '1', label: 'Easy' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'Hard' },
]

export default function VocabularyPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, signInWithGoogle } = useAuthStore()
  const navigate = useNavigate()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [difficulty, setDifficulty] = useState('')
  const [page, setPage] = useState(1)
  const expandId = searchParams.get('expand') || null
  const debouncedSearch = useDebounce(search, 350)

  useEffect(() => { setPage(1) }, [debouncedSearch, difficulty])

  const { data, isLoading, isFetching } = useWords({
    page,
    pageSize: 15,
    search: debouncedSearch,
    difficulty,
  })

  const words = data?.words || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 15)

  const clearSearch = () => {
    setSearch('')
    setSearchParams({})
  }

  // If not authenticated, wrap in a simple no-sidebar layout
  const Wrapper = user ? AppLayout : PublicWrapper

  return (
    <Wrapper onLogin={signInWithGoogle}>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Vocabulary</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total > 0 ? `${total} word${total === 1 ? '' : 's'} total` : 'Browse the vocabulary library'}
          </p>
        </div>

        {/* Sign-in nudge for public users */}
        {!user && (
          <div className="card p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              Sign in to track your learning progress and unlock spaced repetition.
            </p>
            <button
              onClick={signInWithGoogle}
              className="btn-primary flex items-center gap-2 flex-shrink-0 py-2 px-3"
            >
              <LogIn size={14} />
              Sign in
            </button>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search in English or বাংলা..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9 pr-8 py-2.5 text-sm"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400 flex-shrink-0" />
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="input py-2.5 text-sm w-36"
            >
              {DIFFICULTIES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {(debouncedSearch || difficulty) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Filters:</span>
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50 text-brand-700 text-xs rounded-md font-medium">
                "{debouncedSearch}"
                <button onClick={clearSearch}><X size={10} /></button>
              </span>
            )}
            {difficulty && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                {DIFFICULTIES.find(d => d.value === difficulty)?.label}
                <button onClick={() => setDifficulty('')}><X size={10} /></button>
              </span>
            )}
          </div>
        )}

        {/* Word list */}
        <div className={`space-y-2 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-gray-100 rounded" />
                </div>
              </div>
            ))
          ) : words.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-sm">No words found</p>
              {(search || difficulty) && (
                <button
                  onClick={() => { setSearch(''); setDifficulty('') }}
                  className="mt-2 text-sm text-brand-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            words.map(word => (
              <WordCard
                key={word.id}
                word={word}
                showProgress={!!user}
                defaultExpanded={word.id === expandId}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = page <= 3 ? i + 1
                  : page >= totalPages - 2 ? totalPages - 4 + i
                  : page - 2 + i
                if (pageNum < 1 || pageNum > totalPages) return null
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                      pageNum === page
                        ? 'bg-brand-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  )
}

/* Simple public wrapper — no sidebar, just a clean nav bar */
function PublicWrapper({ children, onLogin }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-display font-bold text-xs">V</span>
            </div>
            <span className="font-display font-bold text-gray-900">Vocabulary</span>
          </button>
          <button
            onClick={onLogin}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <LogIn size={15} />
            Sign in
          </button>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {children}
      </div>
    </div>
  )
}
