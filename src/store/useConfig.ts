import { create } from 'zustand'
import { apiGet } from '../api/client'
import type { Question, GoalTemplate } from '../types'

type ConfigState = {
  questions: Question[]
  goals: GoalTemplate[]
  loaded: boolean
  error: string | null
  load: () => Promise<void>
}

// The onboarding flow and goal catalogue come from the server, not the bundle —
// that is the whole point of config-in-DB. Nothing here is hardcoded.
export const useConfig = create<ConfigState>((set) => ({
  questions: [],
  goals: [],
  loaded: false,
  error: null,
  load: async () => {
    try {
      const [q, g] = await Promise.all([
        apiGet<{ questions: Question[] }>('/api/config/onboarding'),
        apiGet<{ goals: GoalTemplate[] }>('/api/config/goals'),
      ])
      set({ questions: q.questions, goals: g.goals, loaded: true, error: null })
    } catch (e) {
      set({ error: (e as Error).message, loaded: true })
    }
  },
}))
