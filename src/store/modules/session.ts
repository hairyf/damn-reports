import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText } from 'ai'
import { defineStore } from 'valtio-define'
import { store } from '@/store'
import 'valtio-define/types'

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
}

export interface ChatSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// 不放在 state 里，避免被持久化
let currentAbortController: AbortController | null = null

export const session = defineStore(
  {
    state: () => ({
      sessions: [] as ChatSession[],
      activeSessionId: null as string | null,
      isStreaming: false,
    }),
    persist: {
      key: 'session',
      storage,
    },
    getters: {
      activeSession(): ChatSession | null {
        if (!this.activeSessionId)
          return this.sessions[0] ?? null
        return this.sessions.find(s => s.id === this.activeSessionId) ?? null
      },
    },
    actions: {
      createSession(initialMessage?: string) {
        const now = new Date().toISOString()
        const id = createId()
        const title = (initialMessage?.trim() || '新会话').slice(0, 30)
        const newSession: ChatSession = {
          id,
          title,
          createdAt: now,
          updatedAt: now,
          messages: [],
        }
        this.sessions.unshift(newSession)
        this.activeSessionId = id
        return newSession
      },
      setActiveSession(id: string) {
        this.activeSessionId = id
      },
      appendMessage(sessionId: string, message: ChatMessage) {
        const target = this.sessions.find(s => s.id === sessionId)
        if (!target)
          return
        target.messages.push(message)
        target.updatedAt = new Date().toISOString()
      },
      deleteSession(id: string) {
        const index = this.sessions.findIndex(s => s.id === id)
        if (index === -1)
          return
        this.sessions.splice(index, 1)
        if (this.activeSessionId === id) {
          this.activeSessionId = this.sessions[0]?.id ?? null
        }
      },
      renameSession(id: string, title: string) {
        const target = this.sessions.find(s => s.id === id)
        if (!target)
          return
        target.title = title.trim() || target.title
        target.updatedAt = new Date().toISOString()
      },
      clearAll() {
        this.sessions = []
        this.activeSessionId = null
      },
      async startStreaming(userContent: string) {
        const content = userContent.trim()
        if (!content)
          return
        if (this.isStreaming) {
          throw new Error('当前正在生成回复，请稍后再试')
        }

        const { llmApiKey, llmBaseUrl, llmModel } = store.setting
        if (!llmApiKey?.trim()) {
          throw new Error('请先在设置中配置 LLM API Key')
        }

        const baseURL = llmBaseUrl?.trim().replace(/\/$/, '')
        const openai = createOpenAI({
          apiKey: llmApiKey,
          baseURL: baseURL || undefined,
        })

        let current = this.activeSession
        if (!current) {
          current = this.createSession(content)
        }

        const isFirstRound = current.messages.length === 0
        const sessionId = current.id
        const now = new Date().toISOString()
        const userMessageId = createId()
        const assistantMessageId = createId()

        const userMessage: ChatMessage = {
          id: userMessageId,
          role: 'user',
          content,
          createdAt: now,
        }
        current.messages.push(userMessage)
        current.messages.push({
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          createdAt: now,
        })
        current.updatedAt = now

        const messagesForModel = current.messages.map(m => ({
          role: m.role,
          content: m.content,
        }))

        const abortController = new AbortController()
        currentAbortController = abortController
        this.isStreaming = true

        try {
          const result = await streamText({
            model: openai.chat(llmModel || 'deepseek-chat'),
            messages: messagesForModel,
            abortSignal: abortController.signal,
          })

          for await (const delta of result.textStream) {
            const target = this.sessions.find(s => s.id === sessionId)
            if (!target)
              break
            const last = target.messages[target.messages.length - 1]
            if (!last || last.id !== assistantMessageId)
              continue
            last.content += delta
            target.updatedAt = new Date().toISOString()
          }

          // 首轮对话结束后，生成一个更合适的会话标题
          if (isFirstRound) {
            const target = this.sessions.find(s => s.id === sessionId)
            if (target && target.messages.length >= 2) {
              try {
                const conversationText = target.messages
                  .map(m => `${m.role === 'user' ? '用户' : '助手'}: ${m.content}`)
                  .join('\n')

                const { text } = await generateText({
                  model: openai.chat(llmModel || 'deepseek-chat'),
                  system: '你是一个标题生成助手，会为用户和 AI 的对话生成简洁的中文标题。',
                  prompt: `根据下面这段用户与 AI 的对话内容，生成一个不超过 12 个汉字的对话标题。\n\n`
                    + `要求：\n- 只返回标题本身，不要任何解释、标点或引号。\n- 尽量简洁，但能概括本轮对话的主要目的。\n\n对话内容：\n${conversationText}`,
                })

                const newTitle = text.trim().split('\n')[0]?.slice(0, 30)
                if (newTitle) {
                  target.title = newTitle
                  target.updatedAt = new Date().toISOString()
                }
              }
              catch {
                // 标题生成失败不影响正常对话，静默忽略
              }
            }
          }
        }
        finally {
          this.isStreaming = false
          currentAbortController = null
        }
      },
      stopStreaming() {
        if (currentAbortController) {
          currentAbortController.abort()
          currentAbortController = null
        }
        this.isStreaming = false
      },
    },
  },
)
