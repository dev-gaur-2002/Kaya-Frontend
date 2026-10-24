import { API_URL } from '../lib/env'
import { supabase } from '../lib/supabase'

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handle(res: Response) {
  // Read the body once as text: a non-JSON reply (a proxy/captive-portal page, a
  // Vercel "A server error has occurred") must surface as itself rather than as an
  // opaque "JSON parse error: unexpected character".
  const text = await res.text()
  if (!text) {
    if (res.ok) return null
    throw new Error(`request failed (${res.status})`)
  }
  let body: any
  try {
    body = JSON.parse(text)
  } catch {
    throw new Error(`server sent ${res.status} non-JSON: ${text.slice(0, 200)}`)
  }
  if (!res.ok) throw new Error(body?.error ?? `request failed (${res.status})`)
  return body
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
    //
    // ponytail: this needs RN's fetch, not expo/fetch — the SDK 54+ default
    // throws "Unsupported FormDataPart implementation" on a {uri} part. The
    // EXPO_PUBLIC_USE_RN_FETCH=1 in .env keeps RN's, which streams the file from
    // disk instead of reading it into JS memory. If Expo drops that flag, switch
    // to `new File(uri)` from expo-file-system and watch memory on 10 MB PDFs.
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
