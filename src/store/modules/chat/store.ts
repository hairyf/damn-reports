import type { FileUIPart } from 'ai'
import type { ChatMessage, ChatSession } from './types'
import { defineStore } from 'valtio-define'
import { store } from '@/store'
import { buildMessagesForModel } from '../llm'
import { MAIN_SESSION_ID } from './types'
import { createId, createMainSession, updateTimestamp } from './utils'
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
      /** 流式更新 assistant 消息内容（由 startStreaming 通过 callbacks 调用） */
      applyStreamDelta(
        sessionId: string,
        assistantMessageId: string,
        delta: string,
        opts?: { replace?: boolean, toolCallIndex?: number },
      ) {
        const target = this.sessions.find(s => s.id === sessionId)
        if (!target)
          return
        const last = target.messages[target.messages.length - 1]
        if (!last || last.id !== assistantMessageId)
          return
        if (opts?.replace && opts.toolCallIndex != null) {
          const toolCall = last.toolCalls?.[opts.toolCallIndex]
          if (toolCall)
            toolCall.result = last.content
          last.content = delta
        }
        else {
          last.content += delta
        }
        updateTimestamp(target)
      },
      /** 流式添加工具调用（由 startStreaming 通过 callbacks 调用） */
      addStreamToolCall(
        sessionId: string,
        assistantMessageId: string,
        toolName: string,
        args: Record<string, unknown>,
      ) {
        const target = this.sessions.find(s => s.id === sessionId)
        if (!target)
          return
        const last = target.messages[target.messages.length - 1]
        if (!last || last.id !== assistantMessageId)
          return
        if (!last.toolCalls)
          last.toolCalls = []
        last.toolCalls.push({ toolName, args, result: '' })
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
        }
      },
      async startStreaming(userContent: string, files: FileUIPart[] = []) {
        const content = userContent.trim()
        if (!content && files.length === 0)
          return
        if (this.isStreaming) {
          throw new Error('当前正在生成回复，请稍后再试')
        }

        if (!store.llm.effectiveApiKey?.trim()) {
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
          await store.llm.createStream({
            messagesForModel,
            abortSignal: abortController.signal,
            callbacks: {
              onTextDelta: (delta, opts) =>
                this.applyStreamDelta(sessionId, assistantMessageId, delta, opts),
              onToolCall: (toolName, args) =>
                this.addStreamToolCall(sessionId, assistantMessageId, toolName, args),
              onToolResult: () => { /* 下一次 onTextDelta 会带 replace: true */ },
            },
          })

          if (isFirstRound && sessionId !== MAIN_SESSION_ID) {
            const target = this.sessions.find(s => s.id === sessionId)
            if (target && target.messages.length >= 2) {
              try {
                const conversationText = target.messages
                  .map(m => `${m.role === 'user' ? '用户' : '助手'}: ${m.content}`)
                  .join('\n')

                const newTitle = await store.llm.generateSessionTitle(conversationText)
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
