import { create } from 'zustand'
import { apiGet, apiPost } from '../api/client'
import type { Message } from '../types'

type ChatState = {
  messages: Message[]
  conversationId: string | null
  sending: boolean
  error: string | null
  send: (text: string) => Promise<void>
  loadFollowUp: () => Promise<void>
}

let tempId = 0

export const useChat = create<ChatState>((set, get) => ({
  messages: [],
  conversationId: null,
  sending: false,
  error: null,

  send: async (text) => {
    const optimistic: Message = {
      id: `temp-${tempId++}`,
      role: 'user',
      content: text,
      safety_rule_key: null,
      created_at: new Date().toISOString(),
    }
    set({ messages: [...get().messages, optimistic], sending: true, error: null })

    try {
      const d = await apiPost<{ reply: string; safetyRuleKey: string | null; conversationId: string }>(
        '/api/chat',
        { message: text, conversationId: get().conversationId ?? undefined },
      )
      set({
        conversationId: d.conversationId,
        sending: false,
        messages: [
          ...get().messages,
          {
            id: `temp-${tempId++}`,
            role: 'assistant',
            content: d.reply,
            safety_rule_key: d.safetyRuleKey,
            created_at: new Date().toISOString(),
          },
        ],
      })
    } catch (e) {
      set({ error: (e as Error).message, sending: false })
    }
  },

  // Follow-ups are in-app for now: the app asks on open and a due one seeds the
  // conversation with an assistant-first message.
  loadFollowUp: async () => {
    try {
      const d = await apiGet<{ followUp: { opener: string } | null }>('/api/followups/due')
      if (!d.followUp || get().messages.length) return
      set({
        messages: [
          {
            id: 'followup',
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
