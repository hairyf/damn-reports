import type { FileUIPart } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText, ToolLoopAgent } from 'ai'
import { defineStore } from 'valtio-define'
import * as tools from '@/config/tools'
import { store } from '@/store'
import 'valtio-define/types'

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  toolCalls?: Array<{ toolName: string, args?: Record<string, unknown> }>
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

function updateTimestamp(session: ChatSession) {
  session.updatedAt = new Date().toISOString()
}

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
        // 显式「新对话」模式：不选中任何会话，聊天区为空
        if (this.activeSessionId === '__new__')
          return null
        if (!this.activeSessionId)
          return this.sessions[0] ?? null
        return this.sessions.find(s => s.id === this.activeSessionId) ?? null
      },
    },
    actions: {
      /** 仅切换到"新对话"状态：清空聊天区，不创建会话；发送第一条消息时会创建会话 */
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
        updateTimestamp(target)
      },
      clearAll() {
        this.sessions = []
        this.activeSessionId = null
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

        const openai = createOpenAI({
          apiKey: llmApiKey,
          baseURL: llmBaseUrl?.trim().replace(/\/$/, '') || undefined,
        })

        let current = this.activeSession
        if (!current)
          current = this.createSession()

        const isFirstRound = current.messages.length === 0
        const sessionId = current.id
        const now = new Date().toISOString()
        const userMessageId = createId()
        const assistantMessageId = createId()

        // 展示用：带附件的用户消息把附件信息简要写入 content（仅用于列表展示）
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

        const hasFiles = files.length > 0
        const messagesForModel = current.messages.map((m, index) => {
          const isLastUser = m.role === 'user' && index === current.messages.length - 2
          if (isLastUser && hasFiles) {
            const textPart = content ? [{ type: 'text' as const, text: content }] : []
            const fileParts = files.map(f => ({
              type: 'file' as const,
              data: f.url,
              mediaType: f.mediaType ?? 'application/octet-stream',
              filename: f.filename,
            }))
            const parts = [...textPart, ...fileParts]
            return { role: 'user' as const, content: parts }
          }
          return { role: m.role, content: m.content }
        })

        const abortController = new AbortController()
        currentAbortController = abortController
        this.isStreaming = true

        try {
          const ws = await db.workspace.findFirst()
          // 创建 ToolLoopAgent 实例
          const agent = new ToolLoopAgent({
            model: openai.chat(llmModel || 'deepseek-chat'),
            instructions: [
              { role: 'system', content: [
                `Current System: ${navigator.userAgent}`,
                `Current Workspace ID: ${ws?.id}`,
              ].join('\n') },
              { role: 'system', content: await readTextFile('AGENTS.md') },
            ],
            tools,
          })

          // 使用 agent.stream() 替代 streamText
          const stream = await agent.stream({
            messages: messagesForModel,
            abortSignal: abortController.signal,
          })

          // 使用 fullStream 来处理文本和工具调用
          let shouldClearOnNextText = false
          for await (const part of stream.fullStream) {
            const target = this.sessions.find(s => s.id === sessionId)
            if (!target)
              break
            const last = target.messages[target.messages.length - 1]
            if (!last || last.id !== assistantMessageId)
              continue

            // 处理文本增量
            if (part.type === 'text-delta') {
              // 如果标记了需要清空，说明这是工具调用后的新文本，清空并重新开始
              if (shouldClearOnNextText) {
                last.content = part.text
                shouldClearOnNextText = false
              }
              else {
                last.content += part.text
              }
              updateTimestamp(target)
            }
            // 处理工具调用
            else if (part.type === 'tool-call') {
              // 记录工具调用信息
              if (!last.toolCalls) {
                last.toolCalls = []
              }
              last.toolCalls.push({
                toolName: part.toolName,
                args: part.input as Record<string, unknown>,
              })
              updateTimestamp(target)
            }
            // 处理工具结果
            else if (part.type === 'tool-result') {
              // 工具结果不显示在消息中，让 AI 继续处理
              // 标记下次接收文本时需要清空
              shouldClearOnNextText = true
              updateTimestamp(target)
            }
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
                  ...generateTitlePrompt(conversationText),
                })

                const newTitle = text.trim().split('\n')[0]?.slice(0, 30)
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
