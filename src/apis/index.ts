import { fetch } from '@tauri-apps/plugin-http'

export function registerN8nUser(
  data: {
    agree: boolean
    email: string
    firstName: string
    lastName: string
    password: string
  },
) {
  return fetch(`${N8N_API_URL}/rest/owner/setup`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function loginN8nUser(
  data: {
    emailOrLdapLoginId: string
    password: string
  },
) {
  return fetch(`${N8N_API_URL}/rest/login`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
