import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, GraduationCap, RotateCcw, ArrowRight,
  Search, X, ChevronDown, Crown, Medal,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { fetchLeaderboard } from '@/services/progressService'
import { useDebounce } from '@/hooks/useDebounce'

/* ── helpers ──────────────────────────────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function Avatar({ url, name, size = 'sm' }) {
  const [broken, setBroken] = useState(false)
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  const initial = (name || '?')[0].toUpperCase()
  if (url && !broken) {
    return (
      <img
        src={url} alt={name}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={`${dim} rounded-full object-cover flex-shrink-0`}
      />
    )
  }
  return (
    <div className={`${dim} rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0`}>
      <span className="text-brand-700 font-semibold">{initial}</span>
    </div>
  )
}

function WordRow({ word }) {
  const [expanded, setExpanded] = useState(false)
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
        <ChevronDown
          size={14}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-gray-50/60">
          {synonyms.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Definition & Synonyms</p>
              <div className="flex flex-wrap gap-1.5">
                {synonyms.map((syn, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-700">{syn}</span>
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

function HomeLeaderboard({ onLogin }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
      .then(rows => setData(rows.slice(0, 5)))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const rankIcon = (i) => {
    if (i === 0) return <Crown size={13} className="text-yellow-500" />
    if (i === 1) return <Medal size={13} className="text-gray-400" />
    if (i === 2) return <Medal size={13} className="text-orange-400" />
    return <span className="text-xs font-semibold text-gray-400 w-[13px] text-center inline-block">{i + 1}</span>
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-display font-bold text-gray-900">Leaderboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Top learners ranked by words mastered</p>
      </div>
      <div className="card overflow-hidden">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 last:border-0 animate-pulse">
              <div className="w-5 h-5 bg-gray-100 rounded" />
              <div className="w-7 h-7 bg-gray-100 rounded-full" />
              <div className="flex-1 h-3 bg-gray-100 rounded" />
              <div className="w-8 h-3 bg-gray-100 rounded" />
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-gray-400">No learners yet.</p>
            <button onClick={onLogin} className="mt-2 text-sm text-brand-600 font-medium hover:underline">Be the first →</button>
          </div>
        ) : (
          <>
            {data.map((entry, i) => (
              <div key={entry.user_id} className={`px-4 py-3 flex items-center gap-3 border-b border-gray-100 last:border-0 ${i === 0 ? 'bg-yellow-50/50' : ''}`}>
                <div className="w-5 flex items-center justify-center flex-shrink-0">{rankIcon(i)}</div>
                <Avatar url={entry.avatar_url} name={entry.display_name} size="sm" />
                <p className="flex-1 text-sm font-medium text-gray-800 truncate">{entry.display_name || 'Anonymous'}</p>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{entry.mastered}</p>
                  <p className="text-xs text-gray-400">mastered</p>
                </div>
              </div>
            ))}
            <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-400">Sign in to appear on the leaderboard</p>
              <button onClick={onLogin} className="text-xs font-medium text-brand-600 hover:underline flex items-center gap-1">
                Sign in <ArrowRight size={11} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
const PAGE_SIZE = 10

export default function HomePage() {
  const { user, signInWithGoogle } = useAuthStore()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [allWords, setAllWords] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [loadingWords, setLoadingWords] = useState(true)
  const [searching, setSearching] = useState(false)
  const [totalWords, setTotalWords] = useState(0)
  const [fetchError, setFetchError] = useState(null)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  // Load first page of words on mount
  useEffect(() => {
    setLoadingWords(true)
    setFetchError(null)
    supabase
      .from('words')
      .select(
        'id, english_word, bangla_meaning, part_of_speech, difficulty_level, english_definition_synonyms, example_sentences',
        { count: 'exact' }
      )
      .order('english_word', { ascending: true })
      .range(0, PAGE_SIZE - 1)
      .then(({ data, error, count }) => {
        if (error) {
          console.error('Words fetch error:', error)
          setFetchError(error.message)
        } else {
          setAllWords(data || [])
          setTotalWords(count || 0)
        }
      })
      .finally(() => setLoadingWords(false))
  }, [])

  // Inline search (also hits Supabase directly — no auth required after RLS fix)
  useEffect(() => {
    if (!debouncedSearch.trim()) { setSearchResults([]); return }
    setSearching(true)
    supabase
      .from('words')
      .select('id, english_word, bangla_meaning, part_of_speech, difficulty_level, english_definition_synonyms, example_sentences')
      .or(`english_word.ilike.%${debouncedSearch.trim()}%,bangla_meaning.ilike.%${debouncedSearch.trim()}%`)
      .order('english_word', { ascending: true })
      .limit(30)
      .then(({ data, error }) => {
        if (!error) setSearchResults(data || [])
      })
      .catch(() => {})
      .finally(() => setSearching(false))
  }, [debouncedSearch])

  const handleLogin = async () => {
    try { await signInWithGoogle() } catch (err) { console.error(err) }
  }

  const displayWords = search.trim() ? searchResults : allWords
  const hasMore = !search.trim() && totalWords > PAGE_SIZE

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-display font-bold text-xs">S</span>
            </div>
            <span className="font-display font-bold text-gray-900">ShobdoKosh</span>
          </div>
          <button
            onClick={handleLogin}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <GoogleIcon />
            Sign in
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-14">

        {/* Hero */}
        <div className="text-center space-y-5 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border border-brand-100 rounded-full text-xs font-medium text-brand-700">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            Free to browse · Sign in to track progress
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 leading-tight">
            Learn English<br />
            <span className="text-brand-600">the smart way</span>
          </h1>
          <p className="text-base text-gray-500 leading-relaxed">
            Vocabulary built for Bengali speakers. Spaced repetition, MCQ tests,
            and progress tracking — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <button
              onClick={handleLogin}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
            >
              <GoogleIcon />
              <span className="text-white">Get started free</span>
            </button>
            {/* ← navigate() instead of href="#vocabulary" */}
            <button
              onClick={() => navigate('/vocabulary')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Browse words
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: GraduationCap, color: 'bg-brand-50 text-brand-600',  title: 'Spaced Repetition', desc: 'Words resurface at the exact right time — Learned → Practiced → Advanced → Mastered.' },
            { icon: BookOpen,      color: 'bg-orange-50 text-orange-600', title: 'MCQ Tests',          desc: 'Test yourself after every batch. Answers revealed all at once at the end.' },
            { icon: RotateCcw,     color: 'bg-green-50 text-green-600',   title: 'Review Queue',       desc: 'Your daily review list is auto-generated. Nothing falls through the cracks.' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="card p-5 space-y-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={17} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Vocabulary + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="vocabulary">

          {/* Vocabulary list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-display font-bold text-gray-900">Browse Vocabulary</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {totalWords > 0 ? `${totalWords} words total · ` : ''}Tap any word to expand.
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search in English or বাংলা..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-9 pr-8 py-2.5 text-sm"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Word list */}
            <div className="card overflow-hidden">
              {(loadingWords || searching) ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="px-4 py-3 border-b border-gray-100 last:border-0 animate-pulse flex items-center gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-28 bg-gray-100 rounded" />
                      <div className="h-3 w-20 bg-gray-100 rounded" />
                    </div>
                    <div className="h-3 w-3 bg-gray-100 rounded" />
                  </div>
                ))
              ) : fetchError ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-red-500 mb-1">Could not load words.</p>
                  <p className="text-xs text-gray-400">Run the RLS fix SQL below and refresh.</p>
                </div>
              ) : displayWords.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-400">
                    {search.trim() ? `No words found for "${search}"` : 'No words available yet.'}
                  </p>
                </div>
              ) : (
                displayWords.map((word, i) => (
                  <WordRow key={word.id || i} word={word} />
                ))
              )}

              {/* Footer row */}
              {!loadingWords && !fetchError && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {hasMore
                      ? `Showing ${PAGE_SIZE} of ${totalWords} words`
                      : search.trim() && searchResults.length > 0
                        ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`
                        : `All ${displayWords.length} words shown`
                    }
                  </p>
                  <button
                    onClick={() => navigate('/vocabulary')}
                    className="text-xs font-medium text-brand-600 hover:underline flex items-center gap-1"
                  >
                    {hasMore ? `View all ${totalWords} words` : 'Full list'} <ArrowRight size={11} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-1">
            <HomeLeaderboard onLogin={handleLogin} />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-4">
          <p className="text-xs text-gray-400">ShobdoKosh · Made for Bengali speakers learning English</p>
        </div>
      </div>
    </div>
  )
}
