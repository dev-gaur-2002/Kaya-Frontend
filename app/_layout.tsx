import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuth } from '../src/store/useAuth'

export default function RootLayout() {
  const init = useAuth((s) => s.init)
  useEffect(init, [init])

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#EFEAE2' },
        }}
      />
    </SafeAreaProvider>
  )
}
