import { useEffect, useMemo, useRef, useState } from 'react'
import { View, ScrollView, ActivityIndicator, Pressable, Text, Animated, Easing } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useConfig } from '../src/store/useConfig'
import { useProfile } from '../src/store/useProfile'
import { QuestionRenderer, isVisible, isAnswered } from '../src/components/QuestionRenderer'
import { Button, Muted, Body, ErrorNote, Card } from '../src/components/ui'

export default function Onboarding() {
  const router = useRouter()
  const { questions, loaded, error: configError, load } = useConfig()
  const { submitOnboarding, loading, error } = useProfile()

  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [step, setStep] = useState(0)
  const [accepted, setAccepted] = useState(false)
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    load()
  }, [load])

  // Conditional questions drop out of the flow entirely rather than being skipped
  // in place, so the progress indicator stays honest.
  const visible = useMemo(
    () => questions.filter((q) => isVisible(q, answers)),
    [questions, answers],
  )

  async function finish(final: Record<string, unknown>) {
    setFinishing(true)
    try {
      await submitOnboarding(final)
      router.replace('/chat')
    } catch {
      // The error comes off the store and is shown on the finishing screen,
      // which keeps the retry next to it rather than back behind the last question.
    }
  }

  if (!loaded) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#6E4A33" />
      </View>
    )
  }

  if (configError) {
    return (
      <SafeAreaView className="flex-1 justify-center bg-bg px-6">
        <ErrorNote message={`Could not load onboarding: ${configError}`} />
      </SafeAreaView>
    )
  }

  // The disclaimer gate. Shown once, before anything is asked.
  if (!accepted) {
    return (
      <SafeAreaView className="flex-1 justify-center gap-6 bg-bg px-6">
        <Card className="gap-4">
          <Body className="font-serif text-2xl">Before we start</Body>
          <Body>
            Kaya is not a doctor and does not diagnose. It will never tell you to start, stop or
            change a medication — that is always a conversation with your prescriber.
          </Body>
          <Body>
            If something is urgent, contact your doctor or emergency services rather than this app.
          </Body>
        </Card>
        <Button label="I understand" onPress={() => setAccepted(true)} />
      </SafeAreaView>
    )
  }

  if (finishing) {
    return <Finishing error={error} busy={loading} onRetry={() => finish(answers)} />
  }

  // Changing an earlier answer can shorten the flow under us, so the index is
  // clamped rather than trusted.
  const idx = Math.min(step, visible.length - 1)
  const q = visible[idx]
  if (!q) return null

  const last = idx === visible.length - 1
  const value = answers[q.id]

  // The last question answered or skipped IS the end of onboarding. There is no
  // confirmation screen to tap through afterwards.
  function advance(next: Record<string, unknown>) {
    if (last) finish(next)
    else setStep(idx + 1)
  }

  function skip() {
    // Skipped means unanswered, so a half-typed or out-of-range value does not
    // ride along to the profile.
    const { [q!.id]: _dropped, ...rest } = answers
    setAnswers(rest)
    advance(rest)
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-6 pb-2 pt-4">
        <View className="flex-row items-center justify-between">
          <Muted>
            {idx + 1} of {visible.length}
          </Muted>
          <Pressable accessibilityRole="button" accessibilityLabel="Skip this question" onPress={skip} hitSlop={12}>
            <Text className="text-sm text-muted underline">Skip</Text>
          </Pressable>
        </View>
        <View className="mt-2 h-1 overflow-hidden rounded-pill bg-line">
          <View
            className="h-1 rounded-pill bg-accent"
            style={{ width: `${((idx + 1) / visible.length) * 100}%` }}
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" keyboardShouldPersistTaps="handled">
        <QuestionRenderer
          question={q}
          value={value}
          onChange={(v) => setAnswers({ ...answers, [q.id]: v })}
        />
      </ScrollView>

      <View className="gap-3 px-6 pb-6 pt-4">
        <Button
          label={last ? 'Done' : 'Continue'}
          onPress={() => advance(answers)}
          disabled={!isAnswered(q, value)}
        />
        {idx > 0 && <Button label="Back" variant="ghost" onPress={() => setStep(idx - 1)} />}
      </View>
    </SafeAreaView>
  )
}

// Synthesis is a model call, so this screen is up for a few seconds. One line at
// a time, each one naming something that is actually happening.
const COPY = [
  'Reading what you told us…',
  'Working out which advice applies to you…',
  'Setting aside the advice that does not…',
  'Choosing a few things worth starting with…',
  'Almost there…',
]

function Finishing({
  error,
  busy,
  onRetry,
}: {
  error: string | null
  busy: boolean
  onRetry: () => void
}) {
  const [i, setI] = useState(0)
  const fade = useRef(new Animated.Value(0)).current

  // Keyed on the line, so each cycle hands over to the next one when it ends.
  // Core Animated keeps this off the JS thread without pulling in reanimated.
  useEffect(() => {
    const ease = { easing: Easing.inOut(Easing.ease), useNativeDriver: true }
    const anim = Animated.sequence([
      Animated.timing(fade, { toValue: 1, duration: 450, ...ease }),
      Animated.delay(1500),
      Animated.timing(fade, { toValue: 0, duration: 450, ...ease }),
    ])
    anim.start(({ finished }) => {
      if (finished) setI((n) => (n + 1) % COPY.length)
    })
    return () => anim.stop()
  }, [i, fade])

  if (error && !busy) {
    return (
      <SafeAreaView className="flex-1 justify-center gap-6 bg-bg px-6">
        <Body className="font-serif text-2xl">That did not go through.</Body>
        <ErrorNote message={error} />
        <Muted>Your answers are still here. Nothing was lost.</Muted>
        <Button label="Try again" onPress={onRetry} busy={busy} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 items-center justify-center gap-8 bg-bg px-6">
      <ActivityIndicator color="#6E4A33" />
      <Animated.Text
        className="text-center font-serif text-2xl leading-9 text-ink"
        style={{
          opacity: fade,
          // The line lifts as it arrives. Small enough to read as settling.
          transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }}
      >
        {COPY[i]}
      </Animated.Text>
    </SafeAreaView>
  )
}
