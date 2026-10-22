import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { apiPost } from '../api/client'
import { useProfile } from './useProfile'
import { useChat } from './useChat'

type AuthState = {
  session: Session | null
  ready: boolean
  init: () => void
  signInAsName: (name: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  ready: false,
  init: () => {
    supabase.auth.getSession().then(({ data }) => set({ session: data.session, ready: true }))
    supabase.auth.onAuthStateChange((_e, session) => set({ session }))
  },
  // Demo build: a name is the whole credential. The server creates the account
  // on first sight and returns a real Supabase session, so everything
  // downstream — tokens, refresh, RLS — is unchanged. There is no password in
  // this app. See the backend's services/demoAuth.ts.
  signInAsName: async (name) => {
    const { session } = await apiPost<{ session: Session }>('/api/demo/login', {
      username: name.trim(),
    })
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })
    if (error) throw error
  },
  signOut: async () => {
    await supabase.auth.signOut()
    // Drop the previous person's data. Without this the gate routes the next
    // sign-in on a stale onboarded_at and sends a brand-new user straight to
    // chat, and their first screen would still hold someone else's messages.
    useProfile.setState({ profile: null, vitals: [], adherence: [], error: null })
    useChat.setState({ messages: [], conversationId: null, error: null })
    set({ session: null })
  },
}))
