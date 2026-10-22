import { Text, Pressable, View, ActivityIndicator } from 'react-native'
import type { ReactNode } from 'react'

export function Title({ children }: { children: ReactNode }) {
  return <Text className="font-serif text-3xl leading-tight text-ink">{children}</Text>
}

export function Body({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <Text className={`text-base leading-6 text-ink ${className}`}>{children}</Text>
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text className="text-sm leading-5 text-muted">{children}</Text>
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <View className={`rounded-card bg-surface p-5 ${className}`}>{children}</View>
}

export function Button({
  label,
  onPress,
  disabled,
  busy,
  variant = 'primary',
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  busy?: boolean
  variant?: 'primary' | 'ghost'
}) {
  const off = disabled || busy
  const base = variant === 'primary' ? 'bg-primary' : 'bg-transparent border border-line'
  const text = variant === 'primary' ? 'text-surface' : 'text-ink'
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off }}
      disabled={off}
      onPress={onPress}
      className={`${base} ${off ? 'opacity-40' : ''} items-center rounded-pill px-6 py-4`}
    >
      {busy ? (
        <ActivityIndicator color={variant === 'primary' ? '#FAF7F2' : '#2E2A26'} />
      ) : (
        <Text className={`${text} text-base font-semibold`}>{label}</Text>
      )}
    </Pressable>
  )
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={`mb-2 mr-2 rounded-pill border px-4 py-3 ${
        selected ? 'border-accent bg-accent' : 'border-line bg-surface'
      }`}
    >
      <Text className={selected ? 'font-semibold text-surface' : 'text-ink'}>{label}</Text>
    </Pressable>
  )
}

export function ErrorNote({ message }: { message: string }) {
  if (!message) return null
  return (
    <View className="rounded-card border border-alarm/30 bg-alarm/10 p-4">
      <Text className="text-alarm">{message}</Text>
    </View>
  )
}
