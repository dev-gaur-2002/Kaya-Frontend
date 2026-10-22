import { useEffect, useState } from 'react'
import { View, ScrollView, TextInput, Pressable, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useProfile } from '../../src/store/useProfile'
import { useConfig } from '../../src/store/useConfig'
import { apiPost } from '../../src/api/client'
import { Title, Muted, Card, Body } from '../../src/components/ui'

const QUICK_VITALS = [
  { kind: 'systolic', label: 'Systolic', unit: 'mmHg' },
  { kind: 'diastolic', label: 'Diastolic', unit: 'mmHg' },
  { kind: 'fasting_glucose', label: 'Fasting glucose', unit: 'mg/dL' },
  { kind: 'weight', label: 'Weight', unit: 'kg' },
]

export default function Today() {
  const { profile, adherence, vitals, load, logVital } = useProfile()
  const { goals, load: loadConfig } = useConfig()
  const [entry, setEntry] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [logged, setLogged] = useState<string[]>([])

  useEffect(() => {
    load()
    loadConfig()
  }, [load, loadConfig])

  const mine = goals.filter((g) => profile?.goals.includes(g.code))

  async function save(kind: string, unit: string) {
    const raw = entry[kind]
    if (!raw) return
    setError('')
    try {
      await logVital(kind, Number(raw), unit)
      setEntry({ ...entry, [kind]: '' })
    } catch (e) {
      // The backend rejects implausible values — surfacing why beats a silent no-op.
      setError((e as Error).message)
    }
  }

  async function markGoal(code: string) {
    await apiPost(`/api/goals/${code}/log`, { completed: true })
    setLogged([...logged, code])
    load()
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingVertical: 24, gap: 24 }}>
        <Title>Today</Title>

        {mine.length > 0 && (
          <View className="gap-3">
            <Muted>Your goals</Muted>
            {mine.map((g) => {
              const a = adherence.find((x) => x.goal_code === g.code)
              const done = logged.includes(g.code)
              return (
                <Pressable key={g.code} onPress={() => markGoal(g.code)}>
                  <Card className="flex-row items-center justify-between">
                    <View className="flex-1 gap-1">
                      <Body className="font-semibold">{g.title}</Body>
                      <Muted>{a ? `${a.done} of last 7 days` : 'Not logged yet'}</Muted>
                    </View>
                    <View
                      className={`h-9 w-9 items-center justify-center rounded-pill border ${
                        done ? 'border-accent bg-accent' : 'border-line'
                      }`}
                    >
                      {done && <Text className="text-surface">✓</Text>}
                    </View>
                  </Card>
                </Pressable>
              )
            })}
          </View>
        )}

        <View className="gap-3">
          <Muted>Log a reading</Muted>
          {error ? (
            <View className="rounded-card border border-alarm/30 bg-alarm/10 p-4">
              <Text className="text-alarm">{error}</Text>
            </View>
          ) : null}
          {QUICK_VITALS.map((v) => (
            <Card key={v.kind} className="flex-row items-center gap-3">
              <View className="flex-1">
                <Body className="font-semibold">{v.label}</Body>
                <Muted>{v.unit}</Muted>
              </View>
              <TextInput
                className="w-24 rounded-pill bg-bg px-4 py-3 text-center text-base text-ink"
                keyboardType="numeric"
                value={entry[v.kind] ?? ''}
                onChangeText={(t) => setEntry({ ...entry, [v.kind]: t })}
                placeholder="—"
                placeholderTextColor="#8A8179"
                onSubmitEditing={() => save(v.kind, v.unit)}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Save ${v.label}`}
                onPress={() => save(v.kind, v.unit)}
                className="h-11 w-11 items-center justify-center rounded-pill bg-primary"
              >
                <Text className="text-surface">↑</Text>
              </Pressable>
            </Card>
          ))}
        </View>

        {vitals.length > 0 && (
          <View className="gap-3">
            <Muted>Recent</Muted>
            <Card className="gap-2">
              {vitals.slice(0, 8).map((v) => (
                <View key={v.id} className="flex-row justify-between">
                  <Body>{v.kind.replace(/_/g, ' ')}</Body>
                  <Muted>
                    {v.value} {v.unit} · {v.measured_at.slice(0, 10)}
                    {v.confirmed ? '' : ' · unconfirmed'}
                  </Muted>
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
