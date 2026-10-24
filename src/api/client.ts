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

export type UploadFile = { uri: string; name: string; mimeType?: string }

/** One PDF, a set of photographs of the same report, or one meal photo. */
export async function apiUpload<T>(
  path: string,
  files: UploadFile[],
  fields?: Record<string, string | undefined>,
): Promise<T> {
  const form = new FormData()
  // Fields first so multer has them parsed by the time the handler runs.
  for (const [k, v] of Object.entries(fields ?? {})) if (v != null) form.append(k, v)
  for (const f of files) {
    // RN's FormData takes this shape for a local file URI. The server sniffs the
    // bytes regardless, so a wrong type here is caught rather than trusted.
    form.append('file', {
      uri: f.uri,
      name: f.name,
      type: f.mimeType ?? 'application/octet-stream',
    } as unknown as Blob)
  }
  return handle(
    await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: await authHeader(),
      body: form,
    }),
  )
}
