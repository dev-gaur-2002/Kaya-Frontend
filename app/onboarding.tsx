import { useEffect, useMemo, useState } from 'react'
import { View, ScrollView, ActivityIndicator } from 'react-native'
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

  useEffect(() => {
    load()
  }, [load])

  // Conditional questions drop out of the flow entirely rather than being skipped
  // in place, so the progress indicator stays honest.
  const visible = useMemo(
    () => questions.filter((q) => isVisible(q, answers)),
    [questions, answers],
  )

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

  const q = visible[step]
  const done = step >= visible.length

  async function finish(final: Record<string, unknown>) {
    try {
      await submitOnboarding(final)
      router.replace('/chat')
    } catch {
      // error surfaces from the store below
    }
  }

  if (done) {
    return (
      <SafeAreaView className="flex-1 justify-center gap-6 bg-bg px-6">
        <Body className="font-serif text-2xl">That is everything.</Body>
        <Muted>Kaya will use this to make sure its advice actually fits you.</Muted>
        <ErrorNote message={error ?? ''} />
        <Button label="Finish" onPress={() => finish(answers)} busy={loading} />
      </SafeAreaView>
    )
  }

  const value = answers[q.id]
  const canAdvance = isAnswered(q, value)

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-6 pb-2 pt-4">
        <Muted>
          {step + 1} of {visible.length}
        </Muted>
        <View className="mt-2 h-1 overflow-hidden rounded-pill bg-line">
          <View
            className="h-1 rounded-pill bg-accent"
            style={{ width: `${((step + 1) / visible.length) * 100}%` }}
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
          label={step === visible.length - 1 ? 'Done' : 'Continue'}
          onPress={() => setStep(step + 1)}
          disabled={!canAdvance}
        />
        {step > 0 && <Button label="Back" variant="ghost" onPress={() => setStep(step - 1)} />}
      </View>
    </SafeAreaView>
  )
}
