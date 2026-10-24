import { useEffect, useRef, useState } from 'react'
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  Text,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import type { ScrollViewInstance } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { useChat } from '../../src/store/useChat'
import { Muted } from '../../src/components/ui'
import { CameraIcon } from '../../src/components/icons'
import { dayLabel, timeOf } from '../../src/lib/date'
import type { Message } from '../../src/types'

// Tails: the one squared corner on the sender's side, as every messaging app does it.
const IN = { borderRadius: 20, borderBottomLeftRadius: 6 }
const OUT = { borderRadius: 20, borderBottomRightRadius: 6 }

function Bubble({ message, grouped }: { message: Message; grouped: boolean }) {
  // Escalation copy deliberately breaks the theme. A hypertensive-crisis message
  // rendered as one more soft chat bubble gets skimmed past like any other gentle
  // suggestion — which is exactly the failure mode that matters here.
  if (message.safety_rule_key) {
    return (
      <View className="my-3 rounded-card bg-alarm p-5">
        <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-alarm-ink opacity-80">
          Please read this
        </Text>
        <Text className="text-lg leading-7 text-alarm-ink">{message.content}</Text>
        <Text className="mt-2 text-right text-xs text-alarm-ink opacity-70">
          {timeOf(message.created_at)}
        </Text>
      </View>
    )
  }

  const mine = message.role === 'user'

  return (
    <View
      className={`max-w-[82%] px-3 py-2 ${mine ? 'self-end bg-accent' : 'self-start bg-surface'} ${
        grouped ? 'mt-0.5' : 'mt-3'
      }`}
      style={mine ? OUT : IN}
    >
      {message.image_uri ? (
        <Image
          source={{ uri: message.image_uri }}
          className="mb-1 h-44 w-44 rounded-2xl"
          resizeMode="cover"
          accessibilityLabel="The meal you sent"
        />
      ) : null}
      {message.content ? (
        <Text className={`text-base leading-6 ${mine ? 'text-surface' : 'text-ink'}`}>
          {message.content}
        </Text>
      ) : null}
      <Text
        className={`mt-1 self-end text-[11px] ${mine ? 'text-surface opacity-70' : 'text-muted'}`}
      >
        {timeOf(message.created_at)}
      </Text>
    </View>
  )
}

function DaySeparator({ label }: { label: string }) {
  return (
    <View className="my-3 self-center rounded-pill bg-surface px-3 py-1">
      <Text className="text-xs uppercase tracking-wider text-muted">{label}</Text>
    </View>
  )
}

export default function Chat() {
  const { messages, send, sendMeal, sending, loading, error, load, loadFollowUp, lastLogged } =
    useChat()
  const [draft, setDraft] = useState('')
  const scroll = useRef<ScrollViewInstance>(null)

  useEffect(() => {
    load().then(loadFollowUp)
    // A meal follow-up comes due hours after the meal, so asking only on open
    // means it arrives on the next launch instead of while they are here.
    // ponytail: one poll a minute. Swap for push when follow-ups leave the app.
    const t = setInterval(loadFollowUp, 60_000)
    return () => clearInterval(t)
  }, [load, loadFollowUp])

  function submit() {
    const text = draft.trim()
    if (!text || sending) return
    setDraft('')
    send(text)
  }

  async function pickMeal(from: 'camera' | 'album') {
    const perm =
      from === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert(
        from === 'camera' ? 'Camera access is off' : 'Photo access is off',
        'Turn it on in Settings to send Kaya a picture of a meal.',
      )
      return
    }
    // quality below 1 keeps a phone photo under the 4 MB the reader accepts.
    const res =
      from === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 })
    const asset = res.canceled ? null : res.assets?.[0]
    if (asset) sendMeal({ uri: asset.uri, mimeType: asset.mimeType })
  }

  // ponytail: the OS sheet, not a custom one. It is two choices and the
  // platform already draws it the way people expect.
  function addMeal() {
    Alert.alert('Send a meal photo', 'Kaya will look at it and reply.', [
      { text: 'Take a photo', onPress: () => pickMeal('camera') },
      { text: 'Choose from album', onPress: () => pickMeal('album') },
      { text: 'Cancel', style: 'cancel' },
    ])
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
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 16, flexGrow: 1, justifyContent: 'flex-end' }}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        >
          {loading && messages.length === 0 ? (
            <ActivityIndicator className="py-16" color="#8A8179" />
          ) : null}

          {!loading && messages.length === 0 && (
            <View className="items-center gap-3 py-16">
              <Text className="text-2xl">✨</Text>
              <Text className="text-center font-serif text-[22px] leading-8 text-ink">
                How has today been?
              </Text>
              <Muted>Tell me a number, a meal, or just how you feel.</Muted>
              <Muted>Readings go here too — “bp 140/90” or “sugar 110”.</Muted>
              <Muted>Send a photo of a meal, or ask to track a new goal.</Muted>
            </View>
          )}

          {messages.map((m, i) => {
            const prev = messages[i - 1]
            const newDay = !prev || dayLabel(prev.created_at) !== dayLabel(m.created_at)
            return (
              <View key={m.id}>
                {newDay && <DaySeparator label={dayLabel(m.created_at)} />}
                <Bubble
                  message={m}
                  grouped={!newDay && !!prev && prev.role === m.role && !prev.safety_rule_key}
                />
              </View>
            )
          })}

          {sending && (
            <View className="mt-3 self-start bg-surface px-4 py-3" style={IN}>
              <ActivityIndicator size="small" color="#8A8179" />
            </View>
          )}

          {/* Confirmation that the numbers in that message were recorded, not just
              read. ponytail: in-memory, so it clears on the next send and is gone
              after a reload — vitals are not linked to a message id server-side. */}
          {lastLogged.length > 0 && (
            <View className="mt-3 self-center rounded-pill bg-surface px-4 py-1.5">
              <Text className="text-xs text-muted">
                ✓ Saved{' '}
                {lastLogged
                  .map((v) => `${v.kind.replace(/_/g, ' ')} ${v.value} ${v.unit}`)
                  .join(' · ')}
              </Text>
            </View>
          )}

          {error ? (
            <View className="my-2 rounded-card border border-alarm/30 bg-alarm/10 p-4">
              <Text className="text-alarm">{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View className="flex-row items-end gap-2 px-4 pb-3 pt-2">
          <TextInput
            className="max-h-32 flex-1 rounded-pill bg-surface px-5 py-3 text-base text-ink"
            value={draft}
            onChangeText={setDraft}
            placeholder="Message Kaya"
            placeholderTextColor="#8A8179"
            multiline
            onSubmitEditing={submit}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send a meal photo"
            onPress={addMeal}
            disabled={sending}
            className={`h-12 w-12 items-center justify-center rounded-pill border border-line ${
              sending ? 'opacity-40' : ''
            }`}
          >
            <CameraIcon color="#6E4A33" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            onPress={submit}
            disabled={!draft.trim() || sending}
            className={`h-12 w-12 items-center justify-center rounded-pill bg-primary ${
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
