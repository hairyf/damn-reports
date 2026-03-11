import type { FileUIPart } from 'ai'
import type { ChatMessage, ChatSession } from './types'
import dayjs from 'dayjs'
import { defineStore } from 'valtio-define'
import { store } from '@/store'
import * as fs from '@/utils/fs-extra'
import { buildMessagesForModel } from '../llm'
import { MAIN_SESSION_SYSTEM_PROMPT } from './prompts'
import { MAIN_SESSION_ID, NEW_SESSION_ID } from './types'
import { createId, createMainSession, updateTimestamp } from './utils'
import 'valtio-define/types'

// 不放在 state 里，避免被持久化；按 sessionId 存储，支持多会话并发
const abortControllers = new Map<string, AbortController>()

/** 流式更新 assistant 消息内容（模块内部使用） */
function applyStreamDelta(
  sessions: ChatSession[],
  sessionId: string,
  messageId: string,
  delta: string,
  opts?: { replace?: boolean, toolCallIndex?: number },
) {
  const session = sessions.find(s => s.id === sessionId)
  if (!session)
    return
  const last = session.messages[session.messages.length - 1]
  if (!last || last.id !== messageId)
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
  updateTimestamp(session)
}

/** 流式添加工具调用（模块内部使用） */
function appendToolCall(
  sessions: ChatSession[],
  sessionId: string,
  messageId: string,
  toolName: string,
  args: Record<string, unknown>,
) {
  const session = sessions.find(s => s.id === sessionId)
  if (!session)
    return
  const last = session.messages[session.messages.length - 1]
  if (!last || last.id !== messageId)
    return
  if (!last.toolCalls)
    last.toolCalls = []
  last.toolCalls.push({ toolName, args, result: '' })
  updateTimestamp(session)
}

/** 首轮对话后自动生成会话标题 */
async function autoGenerateTitle(sessions: ChatSession[], sessionId: string) {
  const target = sessions.find(s => s.id === sessionId)
  if (!target || target.messages.length < 2)
    return
  try {
    const conversationText = target.messages
      .map(m => `${m.role === 'user' ? '用户' : '助手'}: ${m.content}`)
      .join('\n')
    const newTitle = await store.llm.generateTitle(conversationText)
    if (newTitle) {
      target.title = newTitle
      updateTimestamp(target)
    }
  }
  catch {
    // 标题生成失败不影响正常对话，静默忽略
  }
}

export const chat = defineStore(
  {
    state: () => ({
      sessions: [] as ChatSession[],
      activeSessionId: null as string | null,
      /** 正在流式输出的会话 id 列表，用于多会话并发 */
      streamingSessionIds: [] as string[],
    }),
    persist: {
      key: 'chat',
      storage,
    },
    getters: {
      activeSession(): ChatSession | null {
        if (this.activeSessionId === NEW_SESSION_ID)
          return null
        if (!this.activeSessionId)
          return this.sessions[0] ?? null
        return this.sessions.find(s => s.id === this.activeSessionId) ?? null
      },
      /** 当前选中的会话是否正在流式输出（用于输入区禁用/停止按钮） */
      streaming(): boolean {
        if (!this.activeSessionId || this.activeSessionId === NEW_SESSION_ID)
          return false
        return this.streamingSessionIds.includes(this.activeSessionId)
      },
    },
    actions: {
      /** 切换到"新建会话"状态 */
      prepareNew() {
        this.activeSessionId = NEW_SESSION_ID
      },

      /** 创建新会话，插入到主会话之后 */
      create() {
        const now = new Date().toISOString()
        const id = createId()
        const session: ChatSession = {
          id,
          title: '新会话',
          createdAt: now,
          updatedAt: now,
          messages: [],
        }
        const mainIdx = this.sessions.findIndex(s => s.id === MAIN_SESSION_ID)
        if (mainIdx === 0)
          this.sessions.splice(1, 0, session)
        else
          this.sessions.unshift(session)
        this.activeSessionId = id
        return session
      },

      /** 切换活跃会话 */
      activate(id: string) {
        this.activeSessionId = id
      },

      /** 删除会话（主会话不可删除） */
      remove(id: string) {
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

      /** 清空会话消息 */
      clearMessages(id: string) {
        const target = this.sessions.find(s => s.id === id)
        if (!target)
          return
        target.messages = []
        const now = new Date().toISOString()
        target.updatedAt = now
        if (id === MAIN_SESSION_ID)
          target.lastClearedAt = now
      },

      /** 清空已失效的流式状态（应用启动时调用；无活跃请求时才清空，避免误清正在进行的流） */
      clearStaleStreamingState() {
        if (abortControllers.size === 0)
          this.streamingSessionIds = []
      },

      /** 确保主会话存在且置顶 */
      ensureMain() {
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

      /** 发送消息并开始流式生成回复 */
      async send(userContent: string, files: FileUIPart[] = []) {
        const content = userContent.trim()
        if (!content && files.length === 0)
          return
        let current = this.activeSession
        if (!current)
          current = this.create()
        const sessionId = current.id
        if (this.streamingSessionIds.includes(sessionId))
          throw new Error('当前会话正在生成回复，请稍后再试')
        if (!store.llm.resolvedApiKey?.trim())
          throw new Error('请先在设置中配置 LLM API Key')

        const isFirstRound = current.messages.length === 0
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

        const controller = new AbortController()
        abortControllers.set(sessionId, controller)
        if (!this.streamingSessionIds.includes(sessionId))
          this.streamingSessionIds = [...this.streamingSessionIds, sessionId]
        const isMainSession = sessionId === MAIN_SESSION_ID
        const isExistsYesterdayMemory = await fs.exists(`memory/${dayjs().format('YYYY-MM-DD')}.md`)
        const isExistsBootstrap = await fs.exists('BOOTSTRAP.md')
        const systemPrompt = [
          `「当前系统：${navigator.userAgent}」\n「当前时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}」`,
          isMainSession
          && `「Read MAIN_SESSION_SYSTEM_PROMPT」\n${MAIN_SESSION_SYSTEM_PROMPT}`,
          `「Read AGENTS.md」\n${await readTextFile('AGENTS.md')}`,
          `「Read IDENTITY.md」\n${await readTextFile('IDENTITY.md')}`,
          `「Read USER.md」\n${await readTextFile('USER.md')}`,
          `「Read MEMORY.md」\n${await readTextFile('MEMORY.md')}`,
          isExistsYesterdayMemory
          && `「Read memory/YYYY-MM-DD.md」\n${await readTextFile(`memory/${dayjs().format('YYYY-MM-DD')}.md`)}`,
          isExistsBootstrap
          && `「Read BOOTSTRAP.md」\n${await readTextFile('BOOTSTRAP.md')}`,
        ].filter(Boolean).join('\n\n')
        try {
          await store.llm.streamChat({
            messagesForModel,
            abortSignal: controller.signal,
            instructions: [{ role: 'system', content: systemPrompt }],
            callbacks: {
              onTextDelta: (delta, opts) =>
                applyStreamDelta(this.sessions, sessionId, assistantMessageId, delta, opts),
              onToolCall: (toolName, args) =>
                appendToolCall(this.sessions, sessionId, assistantMessageId, toolName, args),
              onToolResult: () => { /* 下一次 onTextDelta 会带 replace: true */ },
            },
          })

          if (isFirstRound && sessionId !== MAIN_SESSION_ID)
            await autoGenerateTitle(this.sessions, sessionId)
        }
        catch (error) {
          console.error(error)
          throw error
        }
        finally {
          abortControllers.delete(sessionId)
          this.streamingSessionIds = this.streamingSessionIds.filter(id => id !== sessionId)
        }
      },

      /** 中止指定会话的流式生成（不传则中止当前选中的会话） */
      abort(sessionId?: string) {
        const id = sessionId ?? this.activeSessionId
        if (!id)
          return
        const controller = abortControllers.get(id)
        if (controller) {
          controller.abort()
          abortControllers.delete(id)
          this.streamingSessionIds = this.streamingSessionIds.filter(sid => sid !== id)
        }
      },
    },
  },
)
