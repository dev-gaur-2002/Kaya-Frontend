import { create } from 'zustand'
import { apiGet, apiPost } from '../api/client'
import type { Profile, Vital, Adherence } from '../types'

type ProfileState = {
  profile: Profile | null
  vitals: Vital[]
  adherence: Adherence[]
  loading: boolean
  error: string | null
  load: () => Promise<void>
  submitOnboarding: (answers: Record<string, unknown>) => Promise<void>
  confirmVital: (id: string) => Promise<void>
  logGoal: (code: string, value: number) => Promise<void>
}

export const useProfile = create<ProfileState>((set, get) => ({
  profile: null,
  vitals: [],
  adherence: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const d = await apiGet<{ profile: Profile; vitals: Vital[]; adherence: Adherence[] }>(
        '/api/profile',
      )
      set({ profile: d.profile, vitals: d.vitals, adherence: d.adherence, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  submitOnboarding: async (answers) => {
    set({ loading: true, error: null })
    try {
      const d = await apiPost<{ profile: Profile }>('/api/onboarding/answers', { answers })
      set({ profile: d.profile, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
      throw e
    }
  },

  confirmVital: async (id) => {
    await apiPost(`/api/vitals/${id}/confirm`)
    await get().load()
  },

  // Set-absolute: the screen sends the count it is now showing, so a retry or a
  // double tap cannot double-count. The server decides whether that hits target.
  logGoal: async (code, value) => {
    await apiPost(`/api/goals/${code}/log`, { value })
    await get().load()
  },
}))
