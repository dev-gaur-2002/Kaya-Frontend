import { useState } from 'react'
import { View, TextInput, Pressable, Text, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../src/store/useAuth'
import { Title, Muted, Button, ErrorNote } from '../src/components/ui'

// ponytail: demo build. A name is the whole sign-in — the server creates the
// account on first sight and returns a real session, so no password and no
// sign-up screen. Typing a name you used before puts you back in that account,
// already onboarded. Restore a real credential before this holds real data.
const SEEDED = ['Asha', 'Ravi', 'Meera', 'Sam']

export default function SignIn() {
  const router = useRouter()
  const { signInAsName } = useAuth()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function enter(who: string) {
    if (!who.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      await signInAsName(who)
      router.replace('/')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center gap-6 px-6"
      >
        <View className="gap-3">
          <Title>Kaya</Title>
          <Muted>
            A health assistant that actually knows what you are managing. Not a doctor, and never a
            substitute for one.
          </Muted>
        </View>

        <View className="gap-3">
          <TextInput
            className="rounded-card bg-surface px-5 py-4 text-base text-ink"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#8A8179"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={() => enter(name)}
          />
          <Muted>No password. Use the same name next time to come back to this profile.</Muted>
        </View>

        <ErrorNote message={error} />

        <Button label="Continue" onPress={() => enter(name)} busy={busy} disabled={!name.trim()} />

        <View className="items-center gap-2">
          <Muted>Or try a profile that is already set up</Muted>
          <View className="flex-row flex-wrap justify-center">
            {SEEDED.map((who) => (
              <Pressable
                key={who}
                accessibilityRole="button"
                accessibilityLabel={`Continue as ${who}`}
                disabled={busy}
                onPress={() => enter(who)}
                className={`mb-2 mr-2 rounded-pill border border-line bg-surface px-4 py-3 ${
                  busy ? 'opacity-40' : ''
                }`}
              >
                <Text className="text-ink">{who}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
