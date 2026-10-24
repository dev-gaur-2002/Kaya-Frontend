import { Image } from 'react-native'

/**
 * Sex comes from onboarding as one of female | male | intersex | na (seeded in
 * the config, not hardcoded here). Intersex gets the non-binary figure; "prefer
 * not to say" and a profile that predates the question get it too, because the
 * alternative is picking one of the other two on their behalf.
 */
const ART = {
  male: require('../../assets/avatar-male.png'),
  female: require('../../assets/avatar-female.png'),
  neutral: require('../../assets/avatar-neutral.png'),
}

export function Avatar({ sex, size = 72 }: { sex?: string | null; size?: number }) {
  const art = sex === 'male' ? ART.male : sex === 'female' ? ART.female : ART.neutral
  return (
    <Image
      source={art}
      accessibilityIgnoresInvertColors
      // Decorative: the name and age beside it already say whose profile this is.
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  )
}
