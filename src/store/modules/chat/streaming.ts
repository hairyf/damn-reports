import type { FileUIPart } from 'ai'
import type { ChatMessage, ChatSession } from './types'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText, ToolLoopAgent } from 'ai'
import * as tools from '@/config/tools'
import { updateTimestamp } from './utils'

export interface StreamContext {
  sessionId: string
  assistantMessageId: string
  getSession: (id: string) => ChatSession | undefined
}

/** 将消息转为模型所需的格式，含附件与工具调用结果 */
export function buildMessagesForModel(
  messages: ChatMessage[],
  content: string,
  files: FileUIPart[],
): Array<{ role: 'user' | 'assistant', content: string | Array<{ type: 'text', text: string } | { type: 'file', data: string, mediaType: string, filename?: string }> }> {
  const hasFiles = files.length > 0
  return messages.map((m, index) => {
    const isLastUser = m.role === 'user' && index === messages.length - 2
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
    if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
      const toolResults = m.toolCalls
        .map(tc => tc.result || '')
        .filter(Boolean)
        .join('\n')
      return { role: m.role, content: toolResults.trim() || m.content }
    }
    return { role: m.role, content: m.content }
  })
}

export interface RunStreamOptions {
  llmApiKey: string
  llmBaseUrl?: string
  llmModel: string
  messagesForModel: ReturnType<typeof buildMessagesForModel>
  abortSignal: AbortController['signal']
  ctx: StreamContext
}

/** 执行 AI 流式对话，通过 ctx 回调更新会话消息 */
export async function runStream(options: RunStreamOptions): Promise<void> {
  const { llmApiKey, llmBaseUrl, llmModel, messagesForModel, abortSignal, ctx } = options

  const openai = createOpenAI({
    apiKey: llmApiKey,
    baseURL: llmBaseUrl?.trim().replace(/\/$/, '') || undefined,
  })

  const agent = new ToolLoopAgent({
    model: openai.chat(llmModel || 'deepseek-chat'),
    instructions: [
      { role: 'system', content: `Current System: ${navigator.userAgent}` },
      { role: 'system', content: await readTextFile('AGENTS.md') },
    ],
    tools,
  })

  const stream = await agent.stream({
    messages: messagesForModel,
    abortSignal,
  })

  let shouldClearOnNextText = false
  let currentToolCallIndex = -1

  for await (const part of stream.fullStream) {
    const target = ctx.getSession(ctx.sessionId)
    if (!target)
      break

    const last = target.messages[target.messages.length - 1]
    if (!last || last.id !== ctx.assistantMessageId)
      continue

    if (part.type === 'text-delta') {
      if (shouldClearOnNextText) {
        const toolCall = last.toolCalls?.[currentToolCallIndex]
        if (toolCall)
          toolCall.result = last.content
        last.content = part.text
        shouldClearOnNextText = false
      }
      else {
        last.content += part.text
      }
      updateTimestamp(target)
    }
    else if (part.type === 'tool-call') {
      if (!last.toolCalls)
        last.toolCalls = []
      last.toolCalls.push({
        toolName: part.toolName,
        args: part.input as Record<string, unknown>,
        result: '',
      })
      currentToolCallIndex = last.toolCalls.length - 1
      updateTimestamp(target)
    }
    else if (part.type === 'tool-result') {
      shouldClearOnNextText = true
      updateTimestamp(target)
    }
  }
}

/** 首轮对话后生成会话标题 */
export async function generateSessionTitle(
  conversationText: string,
  llmApiKey: string,
  llmBaseUrl?: string,
  llmModel?: string,
): Promise<string> {
  const openai = createOpenAI({
    apiKey: llmApiKey,
    baseURL: llmBaseUrl?.trim().replace(/\/$/, '') || undefined,
  })

  const { text } = await generateText({
    model: openai.chat(llmModel || 'deepseek-chat'),
    ...generateTitlePrompt(conversationText),
  })

  const newTitle = text.trim().split('\n')[0]?.slice(0, 30)
  return newTitle || ''
}
