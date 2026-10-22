# Kaya — Frontend

React Native (Expo) + expo-router + zustand + NativeWind.

## Setup

```bash
npm install
```

Point the app at your backend and Supabase project. Either fill in `app.json` →
`extra`, or use env vars which take precedence:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3001 \
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co \
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key> \
npx expo start
```

The anon key is public by design — it ships in the bundle. Row-level security on
every table is what protects the data; see the backend migration.

## Screens

| Route | |
|---|---|
| `app/index.tsx` | gate: signed out → sign-in, not onboarded → onboarding, else chat |
| `app/onboarding.tsx` | renders the question set **fetched from the server** |
| `app/(tabs)/chat.tsx` | conversation |
| `app/(tabs)/today.tsx` | goals and quick vitals logging |
| `app/(tabs)/profile.tsx` | the profile, PDF upload, confirming extracted values |

`src/components/QuestionRenderer.tsx` is what makes onboarding config-driven: one
component switching on `type` from the API. Adding a question is a SQL update on
the backend, not an app release.

## Design

Warm and papery rather than clinical — tokens live in `tailwind.config.js`.
Assistant messages render centered, large and without a bubble so they read as
spoken rather than as a chat app.

One deliberate exception: **escalation messages break the theme.** A
hypertensive-crisis reply rendered as one more soft cream card gets skimmed past
like any other gentle suggestion, so messages carrying a `safety_rule_key` get a
high-contrast treatment instead. Calm everywhere, loud exactly once.

## Builds

Both workflows are `workflow_dispatch` or a `v*` tag, and need `EXPO_TOKEN`
(plus `DIAWI_TOKEN` for iOS) in repo secrets.

- `.github/workflows/android.yml` — EAS build → APK uploaded as a run artifact
- `.github/workflows/ios.yml` — EAS build → uploaded to Diawi, link printed in the log
