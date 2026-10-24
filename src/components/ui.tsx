import { Text, Pressable, View, ActivityIndicator } from 'react-native'
import type { ComponentType, ReactNode } from 'react'

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
  icon: Icon,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  busy?: boolean
  variant?: 'primary' | 'ghost' | 'danger'
  // Taken as a component, not an element, so the icon inherits the variant's
  // text colour instead of each caller having to know it.
  icon?: ComponentType<{ color: string }>
}) {
  const off = disabled || busy
  // `danger` is the alarm colour in its quiet register — outline and ink, never
  // a fill. The filled alarm card is reserved for medical escalation and has to
  // stay the loudest thing in the app.
  const look = {
    primary: { box: 'bg-primary', text: 'text-surface', ink: '#FAF7F2' },
    ghost: { box: 'bg-transparent border border-line', text: 'text-ink', ink: '#2E2A26' },
    danger: { box: 'bg-transparent border border-alarm/30', text: 'text-alarm', ink: '#A33A28' },
  }[variant]
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off }}
      disabled={off}
      onPress={onPress}
      className={`${look.box} ${off ? 'opacity-40' : ''} flex-row items-center justify-center gap-2.5 rounded-pill px-6 py-4`}
    >
      {busy ? (
        <ActivityIndicator color={look.ink} />
      ) : (
        <>
          {Icon ? <Icon color={look.ink} /> : null}
          <Text className={`${look.text} text-base font-semibold`}>{label}</Text>
        </>
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
