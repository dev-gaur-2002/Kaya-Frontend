import { useState } from 'react'
import { View, TextInput, KeyboardAvoidingView, Platform, Pressable, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../src/store/useAuth'
import { Title, Muted, Button, ErrorNote } from '../src/components/ui'

export default function SignIn() {
  const router = useRouter()
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('up')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError('')
    try {
      await (mode === 'in' ? signIn(email.trim(), password) : signUp(email.trim(), password))
      router.replace('/')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const input = 'rounded-card bg-surface px-5 py-4 text-base text-ink'

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
            className={input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#8A8179"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            className={input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#8A8179"
            secureTextEntry
          />
        </View>

        <ErrorNote message={error} />

        <Button
          label={mode === 'in' ? 'Sign in' : 'Create account'}
          onPress={submit}
          busy={busy}
          disabled={!email || password.length < 6}
        />

        <Pressable onPress={() => setMode(mode === 'in' ? 'up' : 'in')} className="items-center">
          <Text className="text-muted">
            {mode === 'in' ? 'Need an account?' : 'Already have an account?'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
