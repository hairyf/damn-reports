export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  toolCalls?: Array<{ toolName: string, args?: Record<string, unknown>, result?: string }>
}

/** 主会话 ID：永久置顶、不可删除、每日清空 */
export const MAIN_SESSION_ID = '__main__'

/** 新建会话占位 ID：表示 UI 处于"新建会话"状态 */
export const NEW_SESSION_ID = '__new__'

export interface ChatSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
  /** 主会话专用：上次清空时间，用于 24 小时自动清空 */
  lastClearedAt?: string
}
