import { API_URL } from '../lib/env'
import { supabase } from '../lib/supabase'

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handle(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? `request failed (${res.status})`)
  }
  return res.json()
}

export async function apiGet<T>(path: string): Promise<T> {
  return handle(await fetch(`${API_URL}${path}`, { headers: await authHeader() }))
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return handle(
    await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: body == null ? undefined : JSON.stringify(body),
    }),
  )
}

export async function apiUpload<T>(path: string, uri: string, name: string): Promise<T> {
  const form = new FormData()
  // RN's FormData takes this shape for a local file URI.
  form.append('file', { uri, name, type: 'application/pdf' } as unknown as Blob)
  return handle(
    await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: await authHeader(),
      body: form,
    }),
  )
}
