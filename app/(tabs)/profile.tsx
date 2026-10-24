import { useEffect, useState } from 'react'
import { View, ScrollView, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as DocumentPicker from 'expo-document-picker'
import { useProfile } from '../../src/store/useProfile'
import { useAuth } from '../../src/store/useAuth'
import { useConfig } from '../../src/store/useConfig'
import { apiUpload } from '../../src/api/client'
import { Title, Muted, Card, Body, Button } from '../../src/components/ui'
import { Avatar } from '../../src/components/Avatar'
import { SignOutIcon, UploadIcon } from '../../src/components/icons'
import { toDMY, ageFrom } from '../../src/lib/date'

const SEX_LABEL: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  intersex: 'Intersex',
}

export default function ProfileScreen() {
  const { profile, vitals, adherence, load, confirmVital, logGoal } = useProfile()
  const { goals, load: loadConfig } = useConfig()
  const signOut = useAuth((s) => s.signOut)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  // Optimistic counts so a tap lands immediately; load() reconciles against the
  // server, which is the one that decides whether a count hit its target.
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    load()
    loadConfig()
  }, [load, loadConfig])

  const mine = goals.filter((g) => profile?.goals.includes(g.code))
  const age = ageFrom(profile?.dob)
  const who = [age != null ? `${age}` : null, profile?.sex ? SEX_LABEL[profile.sex] : null]
    .filter(Boolean)
    .join(' · ')

  function countFor(code: string): number {
    return counts[code] ?? adherence.find((a) => a.goal_code === code)?.today ?? 0
  }

  // ponytail: one request per tap. At a human tap rate a stale write cannot land
  // after a newer one, and the endpoint is set-absolute so the last tap wins.
  // Debounce if goals ever get a press-and-hold.
  function bump(code: string, by: number) {
    const next = Math.max(0, countFor(code) + by)
    setCounts((c) => ({ ...c, [code]: next }))
    logGoal(code, next).catch((e) => setStatus((e as Error).message))
  }

  // Values read out of a report are never trusted silently — they sit here until
  // the user confirms them, and they do not reach the prompt before that.
  const unconfirmed = vitals.filter((v) => !v.confirmed)

  async function upload() {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      multiple: true,
    })
    if (res.canceled || !res.assets?.length) return
    setBusy(true)
    setStatus('')
    try {
      const out = await apiUpload<{
        status: string
        values: unknown[]
        processed: boolean
        oversized: number
      }>(
        '/api/documents',
        res.assets.map((a) => ({ uri: a.uri, name: a.name, mimeType: a.mimeType })),
      )
      if (out.status === 'no_text') {
        setStatus(
          'There was no readable text in that file. Try photographing the pages instead, or tell Kaya the values in chat.',
        )
      } else {
        const n = out.values.length
        setStatus(
          [
            `Found ${n} value${n === 1 ? '' : 's'}.`,
            out.processed ? 'Your profile has been updated.' : null,
            n ? 'Check them below.' : null,
            out.oversized ? `${out.oversized} image${out.oversized === 1 ? ' was' : 's were'} too large to read.` : null,
          ]
            .filter(Boolean)
            .join(' '),
        )
      }
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
        <View className="flex-row items-center gap-4">
          <Avatar sex={profile?.sex} />
          <View className="flex-1 gap-1">
            <Title>{profile?.name ?? 'You'}</Title>
            {who ? <Muted>{who}</Muted> : null}
          </View>
        </View>

        {/* profiles.derived.summary is deliberately not rendered. It is written
            for the model, not for the person it describes. */}

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

        {mine.length > 0 && (
          <View className="gap-3">
            <Muted>Today</Muted>
            {mine.map((g) => {
              const a = adherence.find((x) => x.goal_code === g.code)
              const n = countFor(g.code)
              const hit = n >= g.default_target
              return (
                <Card key={g.code} className="gap-3">
                  <View>
                    <Body className="font-semibold">{g.title}</Body>
                    <Muted>{a ? `${a.done} of last 7 days` : 'Not logged yet'}</Muted>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Step label="−" onPress={() => bump(g.code, -1)} disabled={n === 0} />
                    <View className="items-center">
                      <Text
                        className={`font-serif text-2xl ${hit ? 'text-accent' : 'text-ink'}`}
                      >
                        {n} / {g.default_target}
                      </Text>
                      <Muted>{g.unit}</Muted>
                    </View>
                    <Step label="+" onPress={() => bump(g.code, 1)} />
                  </View>
                </Card>
              )
            })}
          </View>
        )}

        {vitals.length > 0 && (
          <View className="gap-3">
            {/* Readings are logged by telling Kaya in chat; this is the record of them. */}
            <Muted>Recent readings</Muted>
            <Card className="gap-2">
              {vitals.slice(0, 8).map((v) => (
                <View key={v.id} className="flex-row justify-between">
                  <Body>{v.kind.replace(/_/g, ' ')}</Body>
                  <Muted>
                    {v.value} {v.unit} · {toDMY(v.measured_at)}
                    {v.confirmed ? '' : ' · unconfirmed'}
                  </Muted>
                </View>
              ))}
            </Card>
          </View>
        )}

        <View className="gap-3">
          <Muted>Reports</Muted>
          <Button
            label="Upload new report"
            onPress={upload}
            busy={busy}
            variant="ghost"
            icon={UploadIcon}
          />
          <Muted>A PDF, or photographs of every page.</Muted>
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
          <Button label="Sign out" variant="danger" onPress={signOut} icon={SignOutIcon} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

/** 44pt hit area — the smallest a thumb reliably lands on. */
function Step({
  label,
  onPress,
  disabled,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label === '+' ? 'Add one' : 'Take one off'}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`h-11 w-11 items-center justify-center rounded-pill border border-line ${
        disabled ? 'opacity-30' : ''
      }`}
    >
      <Text className="text-xl text-ink">{label}</Text>
    </Pressable>
  )
}
