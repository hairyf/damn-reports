import type { FileUIPart } from 'ai'
import type { ChatMessage, ChatSession } from './types'
import { defineStore } from 'valtio-define'
import { store } from '@/store'

import { buildMessagesForModel, generateSessionTitle, runStream } from './streaming'
import { MAIN_SESSION_ID } from './types'
import { createId, createMainSession, MS_PER_DAY, updateTimestamp } from './utils'
import 'valtio-define/types'

// 不放在 state 里，避免被持久化
let currentAbortController: AbortController | null = null

export const chat = defineStore(
  {
    state: () => ({
      sessions: [] as ChatSession[],
      activeSessionId: null as string | null,
      isStreaming: false,
    }),
    persist: {
      key: 'chat',
      storage,
    },
    getters: {
      activeSession(): ChatSession | null {
        if (this.activeSessionId === '__new__')
          return null
        if (!this.activeSessionId)
          return this.sessions[0] ?? null
        return this.sessions.find(s => s.id === this.activeSessionId) ?? null
      },
    },
    actions: {
      prepareNewChat() {
        this.activeSessionId = '__new__'
      },
      createSession() {
        const now = new Date().toISOString()
        const id = createId()
        const newSession: ChatSession = {
          id,
          title: '新会话',
          createdAt: now,
          updatedAt: now,
          messages: [],
        }
        const mainIdx = this.sessions.findIndex(s => s.id === MAIN_SESSION_ID)
        if (mainIdx === 0)
          this.sessions.splice(1, 0, newSession)
        else
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
        updateTimestamp(target)
      },
      deleteSession(id: string) {
        if (id === MAIN_SESSION_ID)
          return
        const index = this.sessions.findIndex(s => s.id === id)
        if (index === -1)
          return
        this.sessions.splice(index, 1)
        if (this.activeSessionId === id) {
          this.activeSessionId = this.sessions[0]?.id ?? null
        }
      },
      clearSessionMessages(id: string) {
        const target = this.sessions.find(s => s.id === id)
        if (!target)
          return
        target.messages = []
        const now = new Date().toISOString()
        target.updatedAt = now
        if (id === MAIN_SESSION_ID)
          target.lastClearedAt = now
      },
      ensureMainSession() {
        let main = this.sessions.find(s => s.id === MAIN_SESSION_ID)
        if (!main) {
          main = createMainSession()
          this.sessions.unshift(main)
        }
        else {
          const idx = this.sessions.indexOf(main)
          if (idx > 0) {
            this.sessions.splice(idx, 1)
            this.sessions.unshift(main)
          }
          const lastCleared = main.lastClearedAt ? new Date(main.lastClearedAt).getTime() : 0
          if (Date.now() - lastCleared >= MS_PER_DAY && main.messages.length > 0) {
            this.clearSessionMessages(MAIN_SESSION_ID)
          }
        }
      },
      renameSession(id: string, title: string) {
        const target = this.sessions.find(s => s.id === id)
        if (!target)
          return
        target.title = title.trim() || target.title
        updateTimestamp(target)
      },
      clearAll() {
        const main = this.sessions.find(s => s.id === MAIN_SESSION_ID)
        this.sessions = main ? [main] : []
        this.activeSessionId = main?.id ?? null
      },
      async startStreaming(userContent: string, files: FileUIPart[] = []) {
        const content = userContent.trim()
        if (!content && files.length === 0)
          return
        if (this.isStreaming) {
          throw new Error('当前正在生成回复，请稍后再试')
        }

        const { llmApiKey, llmBaseUrl, llmModel } = store.setting
        if (!llmApiKey?.trim()) {
          throw new Error('请先在设置中配置 LLM API Key')
        }

        let current = this.activeSession
        if (!current)
          current = this.createSession()

        const isFirstRound = current.messages.length === 0
        const sessionId = current.id
        const now = new Date().toISOString()
        const userMessageId = createId()
        const assistantMessageId = createId()

        const displayContent = content || (files.length > 0 ? `[${files.length} 个附件]` : '')

        const userMessage: ChatMessage = {
          id: userMessageId,
          role: 'user',
          content: displayContent,
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

        const messagesForModel = buildMessagesForModel(current.messages, content, files)

        const abortController = new AbortController()
        currentAbortController = abortController
        this.isStreaming = true

        try {
          await runStream({
            llmApiKey,
            llmBaseUrl,
            llmModel: llmModel || 'deepseek-chat',
            messagesForModel,
            abortSignal: abortController.signal,
            ctx: {
              sessionId,
              assistantMessageId,
              getSession: id => this.sessions.find(s => s.id === id),
            },
          })

          if (isFirstRound && sessionId !== MAIN_SESSION_ID) {
            const target = this.sessions.find(s => s.id === sessionId)
            if (target && target.messages.length >= 2) {
              try {
                const conversationText = target.messages
                  .map(m => `${m.role === 'user' ? '用户' : '助手'}: ${m.content}`)
                  .join('\n')

                const newTitle = await generateSessionTitle(
                  conversationText,
                  llmApiKey,
                  llmBaseUrl,
                  llmModel,
                )
                if (newTitle) {
                  target.title = newTitle
                  updateTimestamp(target)
                }
              }
              catch {
                // 标题生成失败不影响正常对话，静默忽略
              }
            }
          }
        }
        catch (error) {
          console.error(error)
          throw error
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
