import type { ChatStatus, UIMessage } from 'ai'
import { generateId } from 'ai'
import { defineStore } from 'valtio-define'
import { MAIN_SESSION_ID, NEW_SESSION_ID } from '@/config/constants'
import { store } from '@/store'
import {
  buildSessionTitleFromFirstUserMessage,
  ensureLastMessage,
  mergeStreamedMessage,
} from './utils'

export interface Session {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: UIMessage[]
  status: ChatStatus
}

const abortControllers = new Map<string, AbortController>()

export const session = defineStore({
  state: () => ({
    /**
     * 会话列表
     */
    sessions: [
      {
        id: MAIN_SESSION_ID,
        title: '主会话',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        status: 'ready',
      },
    ] as Session[],
    /**
     * 当前选中的会话 id
     */
    active: null as string | null,
  }),
  getters: {
    /**
     * 当前选中的会话
     */
    session(): Session | null {
      if (this.active === NEW_SESSION_ID)
        return null
      return this.sessions.find(s => s.id === this.active) ?? null
    },

    /**
     * 当前选中的会话的消息
     */
    messages(): UIMessage[] {
      if (this.active === NEW_SESSION_ID)
        return []
      return this.sessions.find(s => s.id === this.active)?.messages ?? []
    },

    /**
     * 当前选中的会话的状态
     */
    status(): ChatStatus {
      if (!this.active || this.active === NEW_SESSION_ID)
        return 'ready'
      return this.sessions.find(s => s.id === this.active)?.status ?? 'ready'
    },
  },
  actions: {

    /**
     * 查找会话
     * @param id 会话 id
     * @returns 会话
     */
    find(id = MAIN_SESSION_ID): Session {
      return this.sessions.find(s => s.id === id) ?? this.sessions[0]
    },

    /**
     * 准备新建会话
     */
    prepare() {
      this.active = NEW_SESSION_ID
    },

    /**
     * 切换活跃会话
     * @param id 会话 id
     */
    activate(id: string) {
      this.active = id
    },

    /**
     * 创建新会话，插入到主会话之后
     */
    create() {
      const id = generateId()
      const now = new Date().toISOString()
      const session: Session = {
        id,
        title: '新会话',
        createdAt: now,
        updatedAt: now,
        messages: [],
        status: 'ready',
      }
      // 始终确保主会话在第一位，新会话插在第二位或最前
      const mainIdx = this.sessions.findIndex(s => s.id === MAIN_SESSION_ID)
      this.sessions.splice(mainIdx >= 0 ? mainIdx + 1 : 0, 0, session)
      this.active = id
      return session
    },

    /**
     * 删除会话（主会话不可删除）
     * @param id 会话 id
     */
    remove(id: string) {
      if (id === MAIN_SESSION_ID)
        return

      this.stop(id, false)

      const index = this.sessions.findIndex(s => s.id === id)

      if (index !== -1) {
        this.sessions.splice(index, 1)
        this.active === id && (this.active = this.sessions[0]?.id)
      }
    },

    /**
     * 清空会话消息
     * @param id 会话 id
     */
    clear(id: string) {
      const target = this.find(id)
      target.messages = []
      target.updatedAt = new Date().toISOString()
      target.status = 'ready'
    },

    /**
     * 发送用户消息
     * @param userContent 用户消息内容
     */
    async send(userContent: string) {
      const content = userContent.trim()
      if (!content)
        return

      const current = this.session ?? this.create()

      if (current.status === 'streaming')
        throw new Error('当前会话正在生成回复，请稍后再试')

      const isFirstRound = current.messages.length === 0

      // 1. 更新 UI 状态
      current.messages.push({
        id: generateId(),
        role: 'user',
        parts: [{ type: 'text', text: content }],
      })

      if (isFirstRound && current.id !== MAIN_SESSION_ID)
        current.title = buildSessionTitleFromFirstUserMessage(content)

      current.updatedAt = new Date().toISOString()
      const controller = new AbortController()
      abortControllers.set(current.id, controller)

      current.status = 'submitted'

      try {
        const stream = await store.agent.streamAgentUIMessage(
          current.messages,
          controller.signal,
        )
        for await (const message of stream) {
          if (current.status !== 'streaming')
            current.status = 'streaming'
          mergeStreamedMessage(current.messages, message)
        }

        console.warn('[Session] 会话: ', current.messages)

        current.status = 'ready'
      }
      catch (error) {
        const isAbort = error instanceof Error && error.name === 'AbortError'
        current.status = isAbort ? 'ready' : 'error'
        if (!isAbort)
          throw error
      }
      finally {
        abortControllers.delete(current.id)
      }
    },

    /**
     * 中止指定会话的流式生成（不传则中止当前选中的会话）
     * @param sessionId 会话 id
     */
    stop(sessionId?: string, message?: string | false) {
      const id = sessionId ?? this.active
      if (!id)
        return
      const target = this.find(id)

      target.status = 'ready'

      abortControllers.get(id)?.abort()
      abortControllers.delete(id)

      if (abortControllers && message !== false) {
        ensureLastMessage(
          this.session?.messages ?? [],
          message ?? `\n\n*${message || '你已让系统停止这条回答'}*`,
        )
      }
    },

    /**
     * 清空已失效的流式状态（应用启动时调用；无活跃请求时才清空，避免误清正在进行的流）
     */
    clearStaleStreaming() {
      if (abortControllers.size === 0)
        this.sessions.forEach(s => s.status = 'ready')
    },
  },
  persist: {
    key: 'session',
    paths: [
      'sessions',
      'active',
    ],
    storage,
  },
})
