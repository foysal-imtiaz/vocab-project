import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,

  setUser: (user) => set({ user }),

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
    }),

  setLoading: (loading) => set({ loading }),

  initialize: async () => {
    try {
      set({ loading: true })

      const {
        data: { session },
      } = await supabase.auth.getSession()

      set({
        session,
        user: session?.user ?? null,
        loading: false,
      })

      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          loading: false,
        })
      })
    } catch (error) {
      console.error('Auth initialization error:', error)

      set({
        user: null,
        session: null,
        loading: false,
      })
    }
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) throw error
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    set({
      user: null,
      session: null,
    })
  },

  get isAuthenticated() {
    return !!get().user
  },
}))