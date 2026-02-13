import type { FileUIPart, LanguageModel } from 'ai'
import type { ChatMessage } from './chat/types'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText, ToolLoopAgent } from 'ai'
import { defineStore } from 'valtio-define'
import { generateTitlePrompt } from '@/config/prompts'
import * as tools from '@/config/tools'
import 'valtio-define/types'

/** 从 Vite 环境变量读取 LLM 配置（需 VITE_ 前缀） */
const envLlmApiKey = import.meta.env.VITE_LLM_API_KEY as string | undefined
const envLlmBaseUrl = import.meta.env.VITE_LLM_BASE_URL as string | undefined

/** Vercel AI Gateway: https://vercel.com/docs/ai-gateway，支持 200+ 模型 */
export const VERCEL_AI_GATEWAY_BASE = 'https://ai-gateway.vercel.sh/v1'
export const VERCEL_AI_GATEWAY_MODELS_URL = 'https://ai-gateway.vercel.sh/v1/models'

export type LlmProvider = 'deepseek' | 'openai' | 'anthropic' | 'moonshot' | 'openrouter' | 'vercel' | 'custom'

export interface LlmProviderConfig {
  label: string
  baseUrl: string
  models: Array<{ value: string, label: string }>
  /** 是否支持动态加载模型列表（从 API 获取） */
  fetchModels?: boolean
}

/** 从 Vercel AI Gateway API 获取完整模型列表（无需认证） */
export async function fetchVercelModels(): Promise<Array<{ value: string, label: string }>> {
  const res = await fetch(VERCEL_AI_GATEWAY_MODELS_URL)
  if (!res.ok)
    throw new Error(`Failed to fetch Vercel models: ${res.status}`)
  const json = await res.json() as { data?: Array<{ id: string, name?: string }> }
  const data = json.data ?? []
  return data.map(m => ({ value: m.id, label: m.name || m.id }))
}

export const LLM_PROVIDERS: Record<LlmProvider, LlmProviderConfig> = {
  deepseek: {
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    models: [
      { value: 'deepseek-chat', label: 'deepseek-chat' },
      { value: 'deepseek-coder', label: 'deepseek-coder' },
      { value: 'deepseek-reasoner', label: 'deepseek-reasoner' },
    ],
  },
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { value: 'gpt-4o', label: 'gpt-4o' },
      { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
      { value: 'gpt-4-turbo', label: 'gpt-4-turbo' },
      { value: 'gpt-4', label: 'gpt-4' },
      { value: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo' },
    ],
  },
  anthropic: {
    label: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      { value: 'claude-sonnet-4-20250514', label: 'Claude 4 Sonnet' },
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    ],
  },
  moonshot: {
    label: 'Moonshot',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { value: 'moonshot-v1-8k', label: 'moonshot-v1-8k' },
      { value: 'moonshot-v1-32k', label: 'moonshot-v1-32k' },
      { value: 'moonshot-v1-128k', label: 'moonshot-v1-128k' },
    ],
  },
  openrouter: {
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
      { value: 'openai/gpt-4o', label: 'GPT-4o' },
      { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'google/gemini-pro', label: 'Gemini Pro' },
      { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
      { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
    ],
  },
  vercel: {
    label: 'Vercel AI Gateway',
    baseUrl: VERCEL_AI_GATEWAY_BASE,
    models: [], // 动态从 API 获取，使用 fetchVercelModels()
    fetchModels: true,
  },
  custom: {
    label: '自定义 (Custom)',
    baseUrl: '',
    models: [],
  },
}

/** 流式回调：由调用方处理文案与工具调用的更新 */
export interface StreamCallbacks {
  onTextDelta: (delta: string, opts?: { replace?: boolean, toolCallIndex?: number }) => void
  onToolCall: (toolName: string, args: Record<string, unknown>) => void
  onToolResult: () => void
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
        .map((tc: { result?: string }) => tc.result || '')
        .filter(Boolean)
        .join('\n')
      return { role: m.role, content: toolResults.trim() || m.content }
    }
    return { role: m.role, content: m.content }
  })
}

export interface CreateStreamOptions {
  messagesForModel: ReturnType<typeof buildMessagesForModel>
  abortSignal: AbortController['signal']
  callbacks: StreamCallbacks
}

export const llm = defineStore({
  state: () => ({
    apiKey: '',
    provider: 'deepseek' as LlmProvider,
    /** 仅当 provider 为 custom 时使用 */
    baseUrl: 'https://api.openai.com/v1',
    /** 预设 provider 的模型 ID，custom 时为用户输入 */
    model: 'deepseek-chat',
  }),
  getters: {
    /** 是否由 Vite 环境变量配置 */
    effectiveIsEnvConfigured() {
      return !!envLlmApiKey?.trim()
    },
    /** 实际使用的 API Key（环境变量优先） */
    effectiveApiKey() {
      return envLlmApiKey?.trim() || this.apiKey || ''
    },
    /** 实际使用的 Base URL（环境变量优先，custom 时用 baseUrl） */
    effectiveBaseUrl() {
      if (envLlmBaseUrl?.trim())
        return envLlmBaseUrl.trim().replace(/\/$/, '')
      if (this.provider === 'custom')
        return this.baseUrl?.trim().replace(/\/$/, '') || ''
      return LLM_PROVIDERS[this.provider].baseUrl.replace(/\/$/, '')
    },
    /** 实际使用的模型 ID */
    effectiveModel() {
      if (this.model)
        return this.model
      const preset = LLM_PROVIDERS[this.provider]?.models[0]?.value
      return preset || 'deepseek-chat'
    },
    /** 是否已配置 API Key（用于初始化流程） */
    isConfigured() {
      return !!envLlmApiKey?.trim() || !!this.apiKey
    },
    /** 当前 provider 的模型选项（custom 为空） */
    modelOptions() {
      return LLM_PROVIDERS[this.provider]?.models ?? []
    },
    /** 是否为 custom provider，需要显示 baseUrl 输入框 */
    isCustomProvider() {
      return this.provider === 'custom'
    },
  },
  actions: {
    /** 根据当前配置创建 AI 模型实例（用于 chat / report 等） */
    createChatModel(): LanguageModel {
      const apiKey = this.effectiveApiKey
      if (!apiKey?.trim())
        throw new Error('请先在设置中配置 LLM API Key')
      return createOpenAI({
        apiKey,
        baseURL: this.effectiveBaseUrl?.trim().replace(/\/$/, '') || undefined,
      }).chat(this.effectiveModel || 'deepseek-chat')
    },

    /** 流式生成文本（report 等），通过 onDelta 回调实时推送增量，返回最终完整文本 */
    async streamGenerateText(systemPrompt: string, onDelta?: (delta: string) => void): Promise<string> {
      let full = ''
      const { textStream } = streamText({
        model: this.createChatModel(),
        system: systemPrompt,
        prompt: '',
      })
      for await (const delta of textStream) {
        full += delta
        onDelta?.(delta)
      }
      return full
    },

    /** 执行 AI 流式对话（chat），通过 callbacks 将增量推送给调用方 */
    async createStream(options: CreateStreamOptions): Promise<void> {
      const { messagesForModel, abortSignal, callbacks } = options

      const agent = new ToolLoopAgent({
        model: this.createChatModel(),
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
        if (part.type === 'text-delta') {
          if (shouldClearOnNextText) {
            callbacks.onTextDelta(part.text, { replace: true, toolCallIndex: currentToolCallIndex })
            shouldClearOnNextText = false
          }
          else {
            callbacks.onTextDelta(part.text)
          }
        }
        else if (part.type === 'tool-call') {
          callbacks.onToolCall(part.toolName, part.input as Record<string, unknown>)
          currentToolCallIndex += 1
        }
        else if (part.type === 'tool-result') {
          shouldClearOnNextText = true
          callbacks.onToolResult()
        }
      }
    },

    /** 首轮对话后生成会话标题 */
    async generateSessionTitle(conversationText: string): Promise<string> {
      const { text } = await generateText({
        model: this.createChatModel(),
        ...generateTitlePrompt(conversationText),
      })

      const newTitle = text.trim().split('\n')[0]?.slice(0, 30)
      return newTitle || ''
    },
  },
  persist: {
    key: 'llm',
    storage,
  },
})
