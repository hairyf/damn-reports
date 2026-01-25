import type * as Types from './index.types'
import { fetch } from '@tauri-apps/plugin-http'

export async function getN8nCredentials() {
  const response = await fetch(`${N8N_API_URL}/rest/credentials`, {
    method: 'GET',
  })
  return response.json()
}

export async function getN8nCredentialsId(credentialsId: string) {
  return fetch(`${N8N_API_URL}/rest/credentials/${credentialsId}`, { method: 'GET' })
    .then(response => response.json())
    .then(data => data?.data as Types.GetN8nCredentialsIdResult | null)
}

export async function postN8nCredentials(body: Types.PostN8nCredentialsBody) {
  const response = await fetch(`${N8N_API_URL}/rest/credentials`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    method: 'POST',
  })
  return response.json() as Promise<Types.PostN8nCredentialsResult>
}

export async function postN8nLogin(body: Types.PostN8nLoginBody) {
  const response = await fetch(`${N8N_API_URL}/rest/login`, {
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    method: 'POST',
  })
  return await response.json() as Promise<Types.PostN8nLoginResult>
}

export async function getN8nLogin() {
  const response = await fetch(`${N8N_API_URL}/rest/login`, {
    method: 'GET',
  })
  return response.json() as Promise<Types.GetN8nLoginResult>
}

export async function patchN8nMe(body: Types.PatchN8nMeBody) {
  const response = await fetch(`${N8N_API_URL}/rest/me`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    method: 'PATCH',
  })
  return response.json() as Promise<Types.PatchN8nMeResult>
}

export async function postN8nRegister(body: Types.PostN8nRegisterBody) {
  const response = await fetch(`${N8N_API_URL}/rest/owner/setup`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    method: 'POST',
  })
  return response.json() as Promise<PostN8nRegisterResult>
}

export async function postN8nMeSurvey(params: Types.PostN8nMeSurveyParams) {
  const response = await fetch(`${N8N_API_URL}/rest/me/survey`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  return response.json()
}

export async function getN8nWorkflow(workflowId: string) {
  return fetch(`${N8N_API_URL}/rest/workflows/${workflowId}`, { method: 'GET' })
    .then(response => response.json())
    .then(data => data?.data as Types.GetN8nWorkflowResult | null)
}

export async function postN8nWorkflow(params: any) {
  return fetch(`${N8N_API_URL}/rest/workflows`, {
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    body: JSON.stringify(params),
  })
    .then(response => response.json())
    .then(data => data?.data as Types.PostN8nWorkflowResult | null)
}

export async function postN8nWorkflowWorkflowIdActivate(paths: { workflowId: string }, body: Types.PostN8nWorkflowWorkflowIdActivateBody) {
  return fetch(`${N8N_API_URL}/rest/workflows/${paths.workflowId}/activate`, {
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getN8nWebhook(webhookId: string) {
  return fetch(`${N8N_API_URL}/webhook/${webhookId}`, { method: 'GET' })
}
