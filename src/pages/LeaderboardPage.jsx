import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Medal, Crown, TrendingUp, BookOpen, ChevronDown } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { fetchLeaderboard } from '@/services/progressService'
import { useAuthStore } from '@/store/authStore'

function Avatar({ url, name, className = 'w-8 h-8' }) {
  const [broken, setBroken] = useState(false)
  const initial = (name || '?')[0].toUpperCase()
  if (url && !broken) {
    return (
      <img
        src={url} alt={name}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={`${className} rounded-full object-cover flex-shrink-0`}
      />
    )
  }
  return (
    <div className={`${className} rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0`}>
      <span className="text-brand-700 text-xs font-semibold">{initial}</span>
    </div>
  )
}

function RankBadge({ rank }) {
  if (rank === 1) return (
    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
      <Crown size={15} className="text-yellow-600" />
    </div>
  )
  if (rank === 2) return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
      <Medal size={15} className="text-gray-500" />
    </div>
  )
  if (rank === 3) return (
    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
      <Medal size={15} className="text-orange-500" />
    </div>
  )
  return (
    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-semibold text-gray-400">{rank}</span>
    </div>
  )
}

function LeaderboardRow({ entry, rank, isCurrentUser }) {
  return (
    <div className={`px-4 py-3.5 flex items-center gap-3 ${
      isCurrentUser ? 'bg-brand-50 border-l-2 border-brand-500' : ''
    }`}>
      <RankBadge rank={rank} />
      <Avatar url={entry.avatar_url} name={entry.display_name} className="w-8 h-8" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {entry.display_name || 'Anonymous'}
          </p>
          {isCurrentUser && (
            <span className="text-xs font-medium text-brand-600 bg-brand-100 px-1.5 py-0.5 rounded flex-shrink-0">
              You
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {entry.mastered} mastered · {entry.total_words} started · {entry.accuracy}% accuracy
        </p>
      </div>
      {/* Show points instead of mastered count */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-gray-900">{entry.score ?? 0}</p>
        <p className="text-xs text-gray-400">pts</p>
      </div>
    </div>
  )
}

function ScoringExplainer() {
  const [open, setOpen] = useState(false)
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <p className="text-sm font-semibold text-gray-800">How scores are calculated</p>
        <ChevronDown
          size={15}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
          <div className="space-y-3 pt-3">
            {[
              { factor: 'Mastered words × 3',   note: 'Primary signal — permanent long-term memory', color: 'bg-green-500' },
              { factor: 'Words started × 1.5',  note: 'Effort signal — breadth of vocabulary studied', color: 'bg-blue-400' },
              { factor: 'Review accuracy × 0.5',note: 'Quality signal — max 50 pts at 100% accuracy', color: 'bg-orange-300' },
              { factor: 'Exam score × 0.5',     note: 'Bonus — exam performance contribution', color: 'bg-purple-400' },
            ].map(({ factor, note, color }) => (
              <div key={factor} className="flex items-start gap-3">
                <span className={`w-2 h-2 rounded-full ${color} mt-1.5 flex-shrink-0`} />
                <div>
                  <p className="text-xs font-semibold text-gray-700">{factor}</p>
                  <p className="text-xs text-gray-400">{note}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs font-mono text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            score = mastered×3 + words×1.5 + accuracy×0.5 + examScore×0.5
          </p>
          <p className="text-xs text-gray-400">
            Mastered words carry the highest per-word weight. Volume, accuracy, and exam performance all contribute but cannot override consistent mastery.
          </p>
        </div>
      )}
    </div>
  )
}

export default function LeaderboardPage() {
  const { user } = useAuthStore()

  const { data = [], isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
    staleTime: 1000 * 60 * 5,
  })

  const currentUserRank = data.findIndex(e => e.user_id === user?.id) + 1
  const topScore = data[0]?.score ?? 0
  const avgScore = data.length
    ? Math.round(data.reduce((a, e) => a + (e.score ?? 0), 0) / data.length)
    : 0

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Leaderboard</h1>
          <p className="text-sm text-gray-500 mt-1">Ranked by score. Keep learning to climb!</p>
        </div>

        {/* Current user rank banner if outside top 10 */}
        {currentUserRank > 10 && (
          <div className="card p-4 flex items-center gap-3 border-brand-200 bg-brand-50">
            <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center">
              <TrendingUp size={16} className="text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Your rank: #{currentUserRank}</p>
              <p className="text-xs text-gray-500">Keep learning to reach the top 10!</p>
            </div>
          </div>
        )}

        {/* Summary stats */}
        {!isLoading && data.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 text-center">
              <p className="text-lg font-display font-bold text-gray-900">{data.length}</p>
              <p className="text-xs text-gray-500">Learners</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-lg font-display font-bold text-gray-900">{topScore}</p>
              <p className="text-xs text-gray-500">Top pts</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-lg font-display font-bold text-gray-900">{avgScore}</p>
              <p className="text-xs text-gray-500">Avg pts</p>
            </div>
          </div>
        )}

        {/* Top 3 podium */}
        {!isLoading && data.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 items-end">
            <div className="card p-3 text-center">
              <Avatar url={data[1]?.avatar_url} name={data[1]?.display_name} className="w-10 h-10 mx-auto mb-2" />
              <Medal size={14} className="text-gray-400 mx-auto mb-1" />
              <p className="text-xs font-semibold text-gray-700 truncate">{data[1]?.display_name}</p>
              <p className="text-lg font-display font-bold text-gray-900 mt-0.5">{data[1]?.score ?? 0}</p>
              <p className="text-xs text-gray-400">pts</p>
            </div>
            <div className="card p-3 text-center border-yellow-200 bg-yellow-50/50 -mt-2">
              <Avatar url={data[0]?.avatar_url} name={data[0]?.display_name} className="w-12 h-12 mx-auto mb-2" />
              <Crown size={15} className="text-yellow-500 mx-auto mb-1" />
              <p className="text-xs font-semibold text-gray-700 truncate">{data[0]?.display_name}</p>
              <p className="text-xl font-display font-bold text-gray-900 mt-0.5">{data[0]?.score ?? 0}</p>
              <p className="text-xs text-gray-400">pts</p>
            </div>
            <div className="card p-3 text-center">
              <Avatar url={data[2]?.avatar_url} name={data[2]?.display_name} className="w-10 h-10 mx-auto mb-2" />
              <Medal size={14} className="text-orange-400 mx-auto mb-1" />
              <p className="text-xs font-semibold text-gray-700 truncate">{data[2]?.display_name}</p>
              <p className="text-lg font-display font-bold text-gray-900 mt-0.5">{data[2]?.score ?? 0}</p>
              <p className="text-xs text-gray-400">pts</p>
            </div>
          </div>
        )}

        {/* Full ranked list */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            {data.length > 10 ? 'Top 10' : 'All learners'}
          </p>
          {isLoading ? (
            <div className="card divide-y divide-gray-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-4 py-3.5 flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3.5 w-28 bg-gray-100 rounded mb-1.5" />
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                  </div>
                  <div className="h-4 w-8 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="card p-10 text-center">
              <BookOpen size={24} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No learners yet. Be the first!</p>
            </div>
          ) : (
            <div className="card divide-y divide-gray-100 overflow-hidden">
              {data.slice(0, 10).map((entry, i) => (
                <LeaderboardRow
                  key={entry.user_id}
                  entry={entry}
                  rank={i + 1}
                  isCurrentUser={entry.user_id === user?.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Current user row if outside top 10 */}
        {currentUserRank > 10 && data.find(e => e.user_id === user?.id) && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Your position</p>
            <div className="card divide-y divide-gray-100 overflow-hidden">
              <LeaderboardRow
                entry={data.find(e => e.user_id === user?.id)}
                rank={currentUserRank}
                isCurrentUser={true}
              />
            </div>
          </div>
        )}

        <ScoringExplainer />
      </div>
    </AppLayout>
  )
}
