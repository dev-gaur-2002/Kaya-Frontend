/**
 * The pure bits of onboarding, kept out of the components so they can be run
 * and checked without a renderer: `npm run check:onboarding`.
 */

/** The exclusive opt-out the config uses wherever a multi question has one. */
const NONE = 'none'

/**
 * "None of these" and an actual condition cannot both be true, so picking
 * either side clears the other. Lives here rather than in the one question that
 * needs it today: any multi question with a `none` option gets it for free.
 */
export function toggleMulti(list: string[], value: string): string[] {
  if (list.includes(value)) return list.filter((x) => x !== value)
  if (value === NONE) return [NONE]
  return [...list.filter((x) => x !== NONE), value]
}

/** Height is stored in centimetres whichever unit was typed. */
export function cmFromFeet(feet: string, inches: string): number | null {
  const total = (Number(feet) || 0) * 12 + (Number(inches) || 0)
  return total > 0 ? Math.round(total * 2.54) : null
}

export function feetFromCm(cm: number | null | undefined): { feet: string; inches: string } {
  const total = cm ? Math.round(cm / 2.54) : 0
  return total > 0
    ? { feet: String(Math.floor(total / 12)), inches: String(total % 12) }
    : { feet: '', inches: '' }
}

/** Within the range the question declares. No range declared means anything. */
export function inRange(n: number, min?: number, max?: number): boolean {
  if (Number.isNaN(n)) return false
  return (min == null || n >= min) && (max == null || n <= max)
}

function demo() {
  const eq = (a: unknown, b: unknown, m: string) => {
    const [x, y] = [JSON.stringify(a), JSON.stringify(b)]
    if (x !== y) throw new Error(`${m}: got ${x}, want ${y}`)
  }

  eq(toggleMulti([], 't2d'), ['t2d'], 'first pick')
  eq(toggleMulti(['t2d'], 't2d'), [], 'unpick')
  eq(toggleMulti(['t2d', 'ckd'], 'none'), ['none'], 'none clears the rest')
  eq(toggleMulti(['none'], 't2d'), ['t2d'], 'a condition clears none')
  eq(toggleMulti(['none'], 'none'), [], 'none unpicks itself')

  eq(cmFromFeet('5', '9'), 175, "5'9\"")
  eq(cmFromFeet('6', ''), 183, "6'0\"")
  eq(cmFromFeet('', ''), null, 'empty is no answer')
  eq(feetFromCm(175), { feet: '5', inches: '9' }, 'round trips')
  eq(feetFromCm(null), { feet: '', inches: '' }, 'no height')

  eq(inRange(175, 100, 250), true, 'in range')
  eq(inRange(9000, 100, 250), false, 'typo rejected')
  eq(inRange(9000), true, 'no range declared')

  console.log('onboarding helpers ok')
}

// True only when node runs the compiled file directly. Metro defines `require`
// but leaves `require.main` undefined, so the app never runs the checks.
// @ts-expect-error node globals are not in this app's tsconfig
if (typeof require !== 'undefined' && require.main === module) demo()
