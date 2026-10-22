import { useEffect, useRef, useState } from 'react'
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  Text,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import type { ScrollViewInstance } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useChat } from '../../src/store/useChat'
import { Muted } from '../../src/components/ui'
import type { Message } from '../../src/types'

function Bubble({ message }: { message: Message }) {
  // Escalation copy deliberately breaks the theme. A hypertensive-crisis message
  // rendered as one more soft cream card gets skimmed past like any other gentle
  // suggestion — which is exactly the failure mode that matters here.
  if (message.safety_rule_key) {
    return (
      <View className="my-4 rounded-card bg-alarm p-5">
        <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-alarm-ink opacity-80">
          Please read this
        </Text>
        <Text className="text-lg leading-7 text-alarm-ink">{message.content}</Text>
      </View>
    )
  }

  if (message.role === 'assistant') {
    // Centered, large, no bubble — it reads as spoken rather than as a chat app.
    return (
      <View className="my-6 px-2">
        <Text className="text-center font-serif text-[22px] leading-8 text-ink">
          {message.content}
        </Text>
      </View>
    )
  }

  return (
    <View className="my-2 max-w-[80%] self-end rounded-card bg-surface px-4 py-3">
      <Text className="text-base leading-6 text-ink">{message.content}</Text>
    </View>
  )
}

export default function Chat() {
  const { messages, send, sending, error, loadFollowUp } = useChat()
  const [draft, setDraft] = useState('')
  const scroll = useRef<ScrollViewInstance>(null)

  useEffect(() => {
    loadFollowUp()
  }, [loadFollowUp])

  function submit() {
    const text = draft.trim()
    if (!text || sending) return
    setDraft('')
    send(text)
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scroll}
          className="flex-1 px-5"
          contentContainerStyle={{ paddingVertical: 24, flexGrow: 1, justifyContent: 'flex-end' }}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <View className="items-center gap-3 py-16">
              <Text className="text-2xl">✨</Text>
              <Text className="text-center font-serif text-[22px] leading-8 text-ink">
                How has today been?
              </Text>
              <Muted>Tell me a number, a meal, or just how you feel.</Muted>
            </View>
          )}

          {messages.map((m) => (
            <Bubble key={m.id} message={m} />
          ))}

          {sending && (
            <View className="my-6 items-center">
              <ActivityIndicator color="#8B9A6B" />
            </View>
          )}

          {error ? (
            <View className="my-2 rounded-card border border-alarm/30 bg-alarm/10 p-4">
              <Text className="text-alarm">{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View className="flex-row items-end gap-2 px-5 pb-3 pt-2">
          <TextInput
            className="max-h-32 flex-1 rounded-pill bg-surface px-5 py-4 text-base text-ink"
            value={draft}
            onChangeText={setDraft}
            placeholder="Message Kaya"
            placeholderTextColor="#8A8179"
            multiline
            onSubmitEditing={submit}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            onPress={submit}
            disabled={!draft.trim() || sending}
            className={`h-14 w-14 items-center justify-center rounded-pill bg-primary ${
              !draft.trim() || sending ? 'opacity-40' : ''
            }`}
          >
            <Text className="text-xl text-surface">↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
