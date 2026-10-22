import { create } from 'zustand'
import { apiGet, apiPost } from '../api/client'
import type { Profile, Vital } from '../types'

type Adherence = { goal_code: string; done: number; of: number }

type ProfileState = {
  profile: Profile | null
  vitals: Vital[]
  adherence: Adherence[]
  loading: boolean
  error: string | null
  load: () => Promise<void>
  submitOnboarding: (answers: Record<string, unknown>) => Promise<void>
  logVital: (kind: string, value: number, unit: string) => Promise<void>
  confirmVital: (id: string) => Promise<void>
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

  logVital: async (kind, value, unit) => {
    await apiPost('/api/vitals', { kind, value, unit })
    await get().load()
  },

  confirmVital: async (id) => {
    await apiPost(`/api/vitals/${id}/confirm`)
    await get().load()
  },
}))
