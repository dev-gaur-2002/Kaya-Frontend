import { useState } from 'react'
import { View, TextInput, Pressable, Text } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import type { Question } from '../types'
import { apiUpload } from '../api/client'
import { Title, Muted, Chip } from './ui'
import { DatePicker } from './DatePicker'
import { UploadIcon } from './icons'
import { toggleMulti, cmFromFeet, feetFromCm, inRange } from '../lib/onboarding'

const INPUT = 'rounded-card bg-surface px-5 py-4 text-base text-ink'
const PLACEHOLDER = '#8A8179'

/**
 * The piece that makes onboarding config-driven: one component that switches on
 * `type` from the server. Adding a question is a SQL update, not a release.
 */
export function QuestionRenderer({
  question,
  value,
  onChange,
}: {
  question: Question
  value: unknown
  onChange: (v: unknown) => void
}) {
  const { min, max } = question.validation ?? {}
  // Why Continue is greyed out. Without this the only feedback for a typo'd
  // height is a dead button.
  const outOfRange = typeof value === 'number' && !inRange(value, min, max)

  return (
    <View className="gap-5">
      <View className="gap-2">
        <Title>{question.prompt}</Title>
        {question.help_text ? <Muted>{question.help_text}</Muted> : null}
      </View>

      {question.type === 'text' && (
        <TextInput
          className={INPUT}
          multiline
          value={(value as string) ?? ''}
          onChangeText={onChange}
          placeholder="Type here"
          placeholderTextColor={PLACEHOLDER}
          style={{ minHeight: 120, textAlignVertical: 'top' }}
        />
      )}

      {question.type === 'number' && (
        <TextInput
          className={INPUT}
          keyboardType="numeric"
          value={value == null ? '' : String(value)}
          onChangeText={(t) => onChange(t === '' ? null : Number(t))}
          placeholder="0"
          placeholderTextColor={PLACEHOLDER}
        />
      )}

      {question.type === 'height' && (
        <HeightInput value={value as number | null} onChange={onChange} />
      )}

      {question.type === 'date' && <DatePicker value={value as string} onChange={onChange} />}

      {question.type === 'boolean' && (
        <View className="flex-row gap-3">
          {[
            { v: true, l: 'Yes' },
            { v: false, l: 'No' },
          ].map((o) => (
            <Pressable
              key={o.l}
              accessibilityRole="radio"
              accessibilityState={{ selected: value === o.v }}
              onPress={() => onChange(o.v)}
              className={`flex-1 items-center rounded-pill border px-6 py-4 ${
                value === o.v ? 'border-accent bg-accent' : 'border-line bg-surface'
              }`}
            >
              <Text className={value === o.v ? 'font-semibold text-surface' : 'text-ink'}>
                {o.l}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {question.type === 'single' && (
        <View className="flex-row flex-wrap">
          {question.options?.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={value === o.value}
              onPress={() => onChange(o.value)}
            />
          ))}
        </View>
      )}

      {question.type === 'multi' && (
        <View className="flex-row flex-wrap">
          {question.options?.map((o) => {
            const list = Array.isArray(value) ? (value as string[]) : []
            return (
              <Chip
                key={o.value}
                label={o.label}
                selected={list.includes(o.value)}
                // toggleMulti keeps "none of these" mutually exclusive with
                // everything else, in both directions.
                onPress={() => onChange(toggleMulti(list, o.value))}
              />
            )
          })}
        </View>
      )}

      {outOfRange ? (
        <Text className="text-sm text-alarm">
          {min != null && max != null
            ? `That should be between ${min} and ${max}.`
            : 'That does not look right.'}
        </Text>
      ) : null}

      {question.allow_upload ? <Upload /> : null}
    </View>
  )
}

/**
 * Centimetres on the wire whichever unit was typed, because the profile column
 * is centimetres and a unit stored alongside the number is a unit that will
 * eventually be read by something that forgot to look at it.
 */
function HeightInput({
  value,
  onChange,
}: {
  value: number | null
  onChange: (cm: number | null) => void
}) {
  const [unit, setUnit] = useState<'cm' | 'ft'>('cm')
  const [ft, setFt] = useState(() => feetFromCm(value).feet)
  const [inch, setInch] = useState(() => feetFromCm(value).inches)

  function toFeet() {
    const { feet, inches } = feetFromCm(value)
    setFt(feet)
    setInch(inches)
    setUnit('ft')
  }

  function fromFeet(f: string, i: string) {
    setFt(f)
    setInch(i)
    onChange(cmFromFeet(f, i))
  }

  return (
    <View className="gap-3">
      <View className="flex-row self-start rounded-pill bg-surface p-1">
        {(['cm', 'ft'] as const).map((u) => (
          <Pressable
            key={u}
            accessibilityRole="radio"
            accessibilityState={{ selected: unit === u }}
            onPress={() => (u === 'ft' ? toFeet() : setUnit('cm'))}
            className={`rounded-pill px-5 py-2 ${unit === u ? 'bg-accent' : ''}`}
          >
            <Text className={unit === u ? 'font-semibold text-surface' : 'text-muted'}>{u}</Text>
          </Pressable>
        ))}
      </View>

      {unit === 'cm' ? (
        <View className="flex-row items-center gap-3">
          <TextInput
            className={`${INPUT} flex-1`}
            keyboardType="numeric"
            value={value == null ? '' : String(value)}
            onChangeText={(t) => onChange(t === '' ? null : Number(t))}
            placeholder="170"
            placeholderTextColor={PLACEHOLDER}
          />
          <Text className="text-base text-muted">cm</Text>
        </View>
      ) : (
        <View className="gap-2">
          <View className="flex-row items-center gap-3">
            <TextInput
              className={`${INPUT} flex-1`}
              keyboardType="numeric"
              value={ft}
              onChangeText={(t) => fromFeet(t, inch)}
              placeholder="5"
              placeholderTextColor={PLACEHOLDER}
              accessibilityLabel="Feet"
            />
            <Text className="text-base text-muted">ft</Text>
            <TextInput
              className={`${INPUT} flex-1`}
              keyboardType="numeric"
              value={inch}
              onChangeText={(t) => fromFeet(ft, t)}
              placeholder="9"
              placeholderTextColor={PLACEHOLDER}
              accessibilityLabel="Inches"
            />
            <Text className="text-base text-muted">in</Text>
          </View>
          {value ? <Muted>{`That is ${value} cm.`}</Muted> : null}
        </View>
      )}
    </View>
  )
}

/**
 * A prescription, on the medications question. Goes through the existing
 * /api/documents pipeline, so the file is stored and on record against the user.
 *
 * ponytail: it does not fill in the answer above — that reader looks for lab
 * values, and inventing medication names off a photo is the one mistake here
 * that would propagate into every future piece of advice. Typed names stay the
 * source of truth. Add a prescription-specific extractor if auto-fill is wanted.
 */
function Upload() {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  async function pick() {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      multiple: true,
    })
    if (res.canceled || !res.assets?.length) return
    setBusy(true)
    setStatus('')
    try {
      await apiUpload('/api/documents', res.assets.map((a) => ({
        uri: a.uri,
        name: a.name,
        mimeType: a.mimeType,
      })))
      setStatus('Saved. Kaya has it on file.')
    } catch (e) {
      setStatus((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <View className="gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={pick}
        className={`flex-row items-center justify-center gap-2.5 rounded-pill border border-line px-6 py-4 ${
          busy ? 'opacity-40' : ''
        }`}
      >
        <UploadIcon color="#6E4A33" />
        <Text className="text-base font-semibold text-ink">
          {busy ? 'Uploading…' : 'Upload a prescription'}
        </Text>
      </Pressable>
      {status ? <Muted>{status}</Muted> : null}
    </View>
  )
}

/** Conditional questions, evaluated against answers already given. */
export function isVisible(q: Question, answers: Record<string, unknown>): boolean {
  if (!q.show_if) return true
  const dep = answers[q.show_if.question]
  if (Array.isArray(dep)) return dep.some((d) => q.show_if!.in.includes(String(d)))
  return q.show_if.in.includes(String(dep))
}

export function isAnswered(q: Question, value: unknown): boolean {
  // A number outside the declared range is a typo, not an answer. Checked even
  // when the question is optional, so it cannot reach the profile untouched.
  if (typeof value === 'number' && !inRange(value, q.validation?.min, q.validation?.max)) {
    return false
  }
  if (!q.validation?.required) return true
  if (value == null || value === '') return false
  if (Array.isArray(value) && value.length === 0) return false
  return true
}
