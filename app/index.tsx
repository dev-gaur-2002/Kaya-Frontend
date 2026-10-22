import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuth } from '../src/store/useAuth'
import { useProfile } from '../src/store/useProfile'

export default function Gate() {
  const { session, ready } = useAuth()
  const { profile, loading, load } = useProfile()

  useEffect(() => {
    if (session) load()
  }, [session, load])

  if (!ready || (session && !profile && loading)) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#6E4A33" />
      </View>
    )
  }

  if (!session) return <Redirect href="/sign-in" />
  if (!profile?.onboarded_at) return <Redirect href="/onboarding" />
  return <Redirect href="/chat" />
}
