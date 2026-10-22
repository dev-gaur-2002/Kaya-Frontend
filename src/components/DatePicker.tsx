import { useRef, useState } from 'react'
import { View, Text, Pressable, Modal, ScrollView } from 'react-native'
import type { ScrollViewInstance } from 'react-native'
import { toDMY, toISODate, daysInMonth } from '../lib/date'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const ROW = 48

/**
 * Our own picker rather than a native one: the system dialog arrives in the OS
 * palette and colour scheme, which is the one thing on this screen that cannot
 * be made to look like the rest of the app.
 *
 * ponytail: tap-to-select columns, not snapping wheels — no scroll maths to get
 * wrong. Swap in snapToInterval if the wheel feel is ever actually asked for.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'dd-mm-yyyy',
  minYear = 1900,
  maxYear = new Date().getFullYear(),
}: {
  value: string | null | undefined
  onChange: (iso: string) => void
  placeholder?: string
  minYear?: number
  maxYear?: number
}) {
  const parsed = value?.slice(0, 10).split('-').map(Number)
  const valid = parsed?.length === 3 && parsed.every((n) => !Number.isNaN(n))

  const [open, setOpen] = useState(false)
  const [y, setY] = useState(valid ? parsed![0] : maxYear - 30)
  const [m, setM] = useState(valid ? parsed![1] : 1)
  const [d, setD] = useState(valid ? parsed![2] : 1)

  const max = daysInMonth(y, m)
  const day = Math.min(d, max)

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i)
  const days = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? `Date ${toDMY(value)}, change` : 'Pick a date'}
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-card bg-surface px-5 py-4"
      >
        <Text className={`text-base ${value ? 'text-ink' : 'text-muted'}`}>
          {value ? toDMY(value) : placeholder}
        </Text>
        <Text className="text-muted">▾</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-ink/40" onPress={() => setOpen(false)}>
          {/* Swallows taps so the sheet itself doesn't dismiss. */}
          <Pressable className="rounded-t-card bg-bg px-5 pb-8 pt-5" onPress={() => {}}>
            <Text className="mb-4 text-center font-serif text-xl text-ink">
              {toDMY(toISODate(y, m, day))}
            </Text>

            <View className="flex-row gap-3" style={{ height: ROW * 5 }}>
              <Column items={days.map(String)} values={days} selected={day} onSelect={setD} />
              <Column
                items={MONTHS}
                values={MONTHS.map((_, i) => i + 1)}
                selected={m}
                onSelect={setM}
              />
              <Column items={years.map(String)} values={years} selected={y} onSelect={setY} />
            </View>

            <View className="mt-5 flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                onPress={() => setOpen(false)}
                className="flex-1 items-center rounded-pill border border-line px-6 py-4"
              >
                <Text className="text-base font-semibold text-ink">Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onChange(toISODate(y, m, day))
                  setOpen(false)
                }}
                className="flex-1 items-center rounded-pill bg-primary px-6 py-4"
              >
                <Text className="text-base font-semibold text-surface">Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

function Column({
  items,
  values,
  selected,
  onSelect,
}: {
  items: string[]
  values: number[]
  selected: number
  onSelect: (v: number) => void
}) {
  const ref = useRef<ScrollViewInstance>(null)
  const centred = useRef(false)

  return (
    <ScrollView
      ref={ref}
      className="flex-1 rounded-card bg-surface"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: ROW * 2 }}
      onContentSizeChange={() => {
        if (centred.current) return
        centred.current = true
        const i = values.indexOf(selected)
        if (i >= 0) ref.current?.scrollTo({ y: i * ROW, animated: false })
      }}
    >
      {items.map((label, i) => {
        const on = values[i] === selected
        return (
          <Pressable
            key={label}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onSelect(values[i])}
            className={`items-center justify-center ${on ? 'bg-accent' : ''}`}
            style={{ height: ROW }}
          >
            <Text className={on ? 'text-base font-semibold text-surface' : 'text-base text-ink'}>
              {label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
