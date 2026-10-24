import { create } from 'zustand'
import { apiGet, apiPost, apiUpload } from '../api/client'
import { useProfile } from './useProfile'
import type { Message, Vital } from '../types'

export type LoggedVital = Pick<Vital, 'kind' | 'value' | 'unit'>

/** What the server says changed about their goals, when a message changed them. */
type GoalChange = { added: string[]; removed: string[]; goals: string[] }

type ChatReply = {
  reply: string
  safetyRuleKey: string | null
  conversationId: string
  logged: LoggedVital[]
  goals: GoalChange | null
}

type ChatState = {
  messages: Message[]
  lastLogged: LoggedVital[]
  conversationId: string | null
  sending: boolean
  loading: boolean
  error: string | null
  load: () => Promise<void>
  send: (text: string) => Promise<void>
  sendMeal: (photo: { uri: string; mimeType?: string }) => Promise<void>
  loadFollowUp: () => Promise<void>
}

let tempId = 0
const temp = () => `temp-${tempId++}`

export const useChat = create<ChatState>((set, get) => ({
  messages: [],
  lastLogged: [],
  conversationId: null,
  sending: false,
  loading: false,
  error: null,

  // History lives on the server; the app holds no conversation id between
  // launches, so it asks for the latest thread on open.
  load: async () => {
    set({ loading: true })
    try {
      const d = await apiGet<{ conversationId: string | null; messages: Message[] }>(
        '/api/conversations/latest',
      )
      set({ messages: d.messages, conversationId: d.conversationId, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  send: async (text) => {
    const optimistic: Message = {
      id: temp(),
      role: 'user',
      content: text,
      safety_rule_key: null,
      created_at: new Date().toISOString(),
    }
    set({ messages: [...get().messages, optimistic], sending: true, error: null, lastLogged: [] })

    try {
      const d = await apiPost<ChatReply>('/api/chat', {
        message: text,
        conversationId: get().conversationId ?? undefined,
      })
      set({
        conversationId: d.conversationId,
        sending: false,
        lastLogged: d.logged,
        messages: [
          ...get().messages,
          {
            id: temp(),
            role: 'assistant',
            content: d.reply,
            safety_rule_key: d.safetyRuleKey,
            created_at: new Date().toISOString(),
          },
        ],
      })
      // Goals changed in chat land on the profile tab without a refresh: both
      // screens read the same store, so reloading it here re-renders that one.
      if (d.goals) useProfile.getState().load()
    } catch (e) {
      set({ error: (e as Error).message, sending: false })
    }
  },

  // The photo goes up, comes back as the line of text the server read off it,
  // and is answered in the thread like anything else they said. The picture
  // stays local — only this session's bubble has it.
  sendMeal: async (photo) => {
    const id = temp()
    const optimistic: Message = {
      id,
      role: 'user',
      content: '',
      safety_rule_key: null,
      created_at: new Date().toISOString(),
      image_uri: photo.uri,
    }
    set({ messages: [...get().messages, optimistic], sending: true, error: null, lastLogged: [] })

    try {
      const d = await apiUpload<ChatReply & { description: string }>(
        '/api/chat/meal',
        [{ uri: photo.uri, name: 'meal.jpg', mimeType: photo.mimeType ?? 'image/jpeg' }],
        { conversationId: get().conversationId ?? undefined },
      )
      set({
        conversationId: d.conversationId,
        sending: false,
        lastLogged: d.logged,
        messages: [
          // Caption the photo with what the server actually recorded, so the
          // bubble matches the history this turn is now part of.
          ...get().messages.map((m) => (m.id === id ? { ...m, content: d.description } : m)),
          {
            id: temp(),
            role: 'assistant',
            content: d.reply,
            safety_rule_key: d.safetyRuleKey,
            created_at: new Date().toISOString(),
          },
        ],
      })
      if (d.goals) useProfile.getState().load()
    } catch (e) {
      // Drop the photo bubble — nothing was recorded, so leaving it reads as
      // though the meal was logged.
      set({
        error: (e as Error).message,
        sending: false,
        messages: get().messages.filter((m) => m.id !== id),
      })
    }
  },

  // Follow-ups are in-app for now: the app asks on open and on a timer while
  // it is up, and a due one is appended to the thread as an assistant message.
  loadFollowUp: async () => {
    if (get().sending) return // do not land one between a message and its reply
    try {
      const d = await apiGet<{ followUp: { id: string; opener: string } | null }>(
        '/api/followups/due',
      )
      // Keyed on the row id, not a constant: a meal follow-up has to be able to
      // arrive after a cadence one already has.
      if (!d.followUp || get().messages.some((m) => m.id === d.followUp!.id)) return
      set({
        messages: [
          ...get().messages,
          {
            id: d.followUp.id,
            role: 'assistant',
            content: d.followUp.opener,
            safety_rule_key: null,
            created_at: new Date().toISOString(),
          },
        ],
      })
    } catch {
      // A missing follow-up is not worth showing the user an error over.
    }
  },
}))
