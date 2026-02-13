import type { ChatSession } from './types'
import { MAIN_SESSION_ID } from './types'

export const MS_PER_DAY = 24 * 60 * 60 * 1000

export function createMainSession(): ChatSession {
  const now = new Date().toISOString()
  return {
    id: MAIN_SESSION_ID,
    title: '主会话',
    createdAt: now,
    updatedAt: now,
    messages: [],
    lastClearedAt: now,
  }
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function updateTimestamp(session: ChatSession): void {
  session.updatedAt = new Date().toISOString()
}
