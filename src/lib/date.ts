/** Storage stays ISO (YYYY-MM-DD); every screen shows dd-mm-yyyy. */

export function toDMY(iso: string | null | undefined): string {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return y && m && d ? `${d}-${m}-${y}` : ''
}

export function toISODate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate()
}

/** 9:42 pm — written out rather than via Intl, which Hermes doesn't always carry. */
export function timeOf(iso: string): string {
  const t = new Date(iso)
  const h = t.getHours()
  return `${h % 12 === 0 ? 12 : h % 12}:${String(t.getMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}

/** "Today" / "Yesterday" / dd-mm-yyyy, for chat day separators. */
export function dayLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const diff = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86400000,
  )
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return toDMY(toISODate(d.getFullYear(), d.getMonth() + 1, d.getDate()))
}
