/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Warm and papery, not clinical. This is something a person opens every
        // day about their own body — it should not look like a hospital chart.
        bg: '#EFEAE2',
        surface: '#FAF7F2',
        ink: '#2E2A26',
        muted: '#8A8179',
        primary: '#6E4A33',
        accent: '#8B9A6B',
        line: '#E2DBD0',
        // Deliberately outside the palette. Escalation copy must break the
        // theme so it cannot be skimmed past as one more gentle suggestion.
        alarm: '#A33A28',
        'alarm-ink': '#FFF6F3',
      },
      borderRadius: { card: '24px', pill: '999px' },
      fontFamily: { serif: ['Georgia', 'serif'] },
    },
  },
  plugins: [],
}
