import { fetch } from '@tauri-apps/plugin-http'

export interface PostN8nRegisterBody {
  agree: boolean
  email: string
  firstName: string
  lastName: string
  password: string
}

export interface PostN8nRegisterResult {
  code?: number
  data: any
  message?: string
}

export async function postN8nRegister(body: PostN8nRegisterBody) {
  const response = await fetch(`${N8N_API_URL}/rest/owner/setup`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    method: 'POST',
  })
  return response.json() as Promise<PostN8nRegisterResult>
}
