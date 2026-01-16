export interface PostN8nCredentialsBody {
  isGlobal: boolean
  isResolvable: boolean
  data: { apiKey: string }
  name: string
  type: string
}

export interface PostN8nCredentialsResult {
  code?: number
  data: {
    updatedAt: string
    name: string
    data: string
    type: string
    isManaged: false
    isResolvable: false
    id: string
    resolverId: string | null
    createdAt: string
    isGlobal: boolean
    resolvableAllowFallback: boolean
    scopes: string[]
  }
  message?: string
}

export async function postN8nCredentials(body: PostN8nCredentialsBody) {
  const response = await fetch(`${N8N_API_URL}/rest/credentials`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    method: 'POST',
  })
  return response.json() as Promise<PostN8nCredentialsResult>
}
