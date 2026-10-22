import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthState = {
  session: Session | null
  ready: boolean
  init: () => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  ready: false,
  init: () => {
    supabase.auth.getSession().then(({ data }) => set({ session: data.session, ready: true }))
    supabase.auth.onAuthStateChange((_e, session) => set({ session }))
  },
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },
  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  },
  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null })
  },
}))
