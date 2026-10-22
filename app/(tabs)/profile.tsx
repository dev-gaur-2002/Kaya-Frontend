import { useEffect, useState } from 'react'
import { View, ScrollView, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as DocumentPicker from 'expo-document-picker'
import { useProfile } from '../../src/store/useProfile'
import { useAuth } from '../../src/store/useAuth'
import { apiUpload } from '../../src/api/client'
import { Title, Muted, Card, Body, Button } from '../../src/components/ui'
import { toDMY } from '../../src/lib/date'

export default function ProfileScreen() {
  const { profile, vitals, load, confirmVital } = useProfile()
  const signOut = useAuth((s) => s.signOut)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    load()
  }, [load])

  // Values read out of a PDF are never trusted silently — they sit here until
  // the user confirms them, and they do not reach the prompt before that.
  const unconfirmed = vitals.filter((v) => !v.confirmed)

  async function upload() {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' })
    if (res.canceled || !res.assets?.[0]) return
    const file = res.assets[0]
    setBusy(true)
    setStatus('')
    try {
      const out = await apiUpload<{ status: string; values: unknown[] }>(
        '/api/documents',
        file.uri,
        file.name,
      )
      setStatus(
        out.status === 'no_text'
          ? 'That looks like a scan rather than a digital PDF, so there was no text to read. Type the values in on Today instead.'
          : `Found ${out.values.length} value${out.values.length === 1 ? '' : 's'}. Check them below.`,
      )
      load()
    } catch (e) {
      setStatus((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingVertical: 24, gap: 24 }}>
        <Title>You</Title>

        {profile?.derived?.summary ? (
          <Card>
            <Body>{profile.derived.summary}</Body>
          </Card>
        ) : null}

        <View className="gap-3">
          <Muted>Conditions</Muted>
          <Card>
            <Body>
              {profile?.conditions.length ? profile.conditions.join(', ') : 'None recorded'}
            </Body>
          </Card>
        </View>

        {profile?.medications.length ? (
          <View className="gap-3">
            <Muted>Medications</Muted>
            <Card className="gap-2">
              {profile.medications.map((m) => (
                <View key={m.name}>
                  <Body className="font-semibold">{m.name}</Body>
                  {m.purpose || m.timing ? (
                    <Muted>{[m.purpose, m.timing].filter(Boolean).join(' · ')}</Muted>
                  ) : null}
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        <View className="gap-3">
          <Muted>Lab reports</Muted>
          <Button label="Upload a PDF" onPress={upload} busy={busy} variant="ghost" />
          {status ? <Muted>{status}</Muted> : null}
        </View>

        {unconfirmed.length > 0 && (
          <View className="gap-3">
            <Muted>Read from your documents — confirm before these count</Muted>
            {unconfirmed.map((v) => (
              <Card key={v.id} className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Body className="font-semibold">
                    {v.kind.replace(/_/g, ' ')}: {v.value} {v.unit}
                  </Body>
                  <Muted>{toDMY(v.measured_at)}</Muted>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Confirm ${v.kind}`}
                  onPress={() => confirmVital(v.id)}
                  className="rounded-pill bg-accent px-5 py-3"
                >
                  <Text className="font-semibold text-surface">Confirm</Text>
                </Pressable>
              </Card>
            ))}
          </View>
        )}

        <View className="gap-3 pt-4">
          <Muted>
            Kaya is not a doctor and does not diagnose. It will never tell you to change a
            medication. For anything urgent, contact your doctor or emergency services.
          </Muted>
          <Button label="Sign out" variant="ghost" onPress={signOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
