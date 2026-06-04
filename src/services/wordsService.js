import { supabase } from '@/lib/supabase'

/**
 * Fetch words with optional progress join.
 * If userId is null (public/unauthenticated), returns plain words without progress.
 */
export async function fetchWordsWithProgress({
  userId = null,
  page = 1,
  pageSize = 20,
  search = '',
  difficulty = '',
}) {
  // ── Public (no user) — plain words only ──────────────────────────────────
  if (!userId) {
    let q = supabase
      .from('words')
      .select('*', { count: 'exact' })
      .order('english_word', { ascending: true })

    if (search && search.trim()) {
      q = q.or(`english_word.ilike.%${search.trim()}%,bangla_meaning.ilike.%${search.trim()}%`)
    }
    if (difficulty) q = q.eq('difficulty_level', Number(difficulty))
    q = q.range((page - 1) * pageSize, page * pageSize - 1)

    const { data, error, count } = await q
    if (error) throw error
    return {
      words: (data || []).map(w => ({ ...w, progress: null })),
      total: count || 0,
      page,
      pageSize,
    }
  }

  // ── Authenticated — words + progress join ─────────────────────────────────
  let query = supabase
    .from('words')
    .select(
      `*,
      user_progress!left(
        id, learning_tier, mastery_score,
        last_reviewed_at, next_review_date,
        total_correct, total_wrong
      )`,
      { count: 'exact' }
    )
    .eq('user_progress.user_id', userId)
    .order('english_word', { ascending: true })

  if (search && search.trim()) {
    query = query.or(
      `english_word.ilike.%${search.trim()}%,bangla_meaning.ilike.%${search.trim()}%`
    )
  }
  if (difficulty) query = query.eq('difficulty_level', Number(difficulty))
  query = query.range((page - 1) * pageSize, page * pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  return {
    words: (data || []).map(w => ({
      ...w,
      progress: w.user_progress?.[0] || null,
      user_progress: undefined,
    })),
    total: count || 0,
    page,
    pageSize,
  }
}

/**
 * Lightweight search — no progress join. Used by homepage and dashboard dropdown.
 */
export async function searchWords({ search = '', pageSize = 6 }) {
  if (!search.trim()) return { words: [], total: 0 }

  const { data, error, count } = await supabase
    .from('words')
    .select('id, english_word, bangla_meaning, part_of_speech, difficulty_level', {
      count: 'exact',
    })
    .or(
      `english_word.ilike.%${search.trim()}%,bangla_meaning.ilike.%${search.trim()}%`
    )
    .order('english_word', { ascending: true })
    .limit(pageSize)

  if (error) throw error
  return { words: data || [], total: count || 0 }
}

/**
 * Fetch words due for review today
 */
export async function fetchDueWords(userId) {
  const today = new Date().toISOString()

  const { data, error } = await supabase
    .from('user_progress')
    .select('*, words(*)')
    .eq('user_id', userId)
    .lte('next_review_date', today)
    .gt('learning_tier', 0)
    .order('next_review_date', { ascending: true })

  if (error) throw error
  return (data || []).map(p => ({
    ...p.words,
    progress: { ...p, words: undefined },
  }))
}

/**
 * Fetch a batch of new (unstarted) words for learning
 */
export async function fetchNewWords(userId, limit = 10) {
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('word_id')
    .eq('user_id', userId)

  const learnedWordIds = (progressData || []).map(p => p.word_id)

  let query = supabase
    .from('words')
    .select('*')
    .limit(limit)
    .order('difficulty_level', { ascending: true })

  if (learnedWordIds.length > 0) {
    query = query.not('id', 'in', `(${learnedWordIds.join(',')})`)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}
