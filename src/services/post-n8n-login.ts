import { fetch } from '@tauri-apps/plugin-http'

export interface PostN8nLoginBody {
  emailOrLdapLoginId: string
  password: string
}

export interface PostN8nLoginResult {
  code?: number
  message?: string
  data: any
}

export async function postN8nLogin(body: PostN8nLoginBody) {
  const response = await fetch(`${N8N_API_URL}/rest/login`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    method: 'POST',
  })
  return response.json() as Promise<PostN8nLoginResult>
}
