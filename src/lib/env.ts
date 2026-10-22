import Constants from 'expo-constants'

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>

// EXPO_PUBLIC_* wins so CI and local overrides work without editing app.json.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://localhost:3001'
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? ''
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey ?? ''
