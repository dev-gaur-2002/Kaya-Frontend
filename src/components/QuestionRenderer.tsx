import { View, TextInput, Pressable, Text } from 'react-native'
import type { Question } from '../types'
import { Title, Muted, Chip } from './ui'
import { DatePicker } from './DatePicker'

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
  const input = 'rounded-card bg-surface px-5 py-4 text-base text-ink'

  return (
    <View className="gap-5">
      <View className="gap-2">
        <Title>{question.prompt}</Title>
        {question.help_text ? <Muted>{question.help_text}</Muted> : null}
      </View>

      {question.type === 'text' && (
        <TextInput
          className={input}
          multiline
          value={(value as string) ?? ''}
          onChangeText={onChange}
          placeholder="Type here"
          placeholderTextColor="#8A8179"
          style={{ minHeight: 120, textAlignVertical: 'top' }}
        />
      )}

      {question.type === 'number' && (
        <TextInput
          className={input}
          keyboardType="numeric"
          value={value == null ? '' : String(value)}
          onChangeText={(t) => onChange(t === '' ? null : Number(t))}
          placeholder="0"
          placeholderTextColor="#8A8179"
        />
      )}

      {question.type === 'date' && (
        <DatePicker value={value as string} onChange={onChange} />
      )}

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
            const on = list.includes(o.value)
            return (
              <Chip
                key={o.value}
                label={o.label}
                selected={on}
                onPress={() =>
                  onChange(on ? list.filter((x) => x !== o.value) : [...list, o.value])
                }
              />
            )
          })}
        </View>
      )}
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
  if (!q.validation?.required) return true
  if (value == null || value === '') return false
  if (Array.isArray(value) && value.length === 0) return false
  return true
}
