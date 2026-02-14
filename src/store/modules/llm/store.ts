import type { LanguageModel, SystemModelMessage } from 'ai'
import type { CreateStreamOptions, LlmProvider } from './types'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText, ToolLoopAgent } from 'ai'
import { defineStore } from 'valtio-define'
import { generateTitlePrompt } from '@/config/prompts'
import * as tools from '@/tools'
import { LLM_PROVIDERS } from './providers'
import 'valtio-define/types'

/** 从 Vite 环境变量读取 LLM 配置（需 VITE_ 前缀） */
const envLlmApiKey = import.meta.env.VITE_LLM_API_KEY as string | undefined
const envLlmBaseUrl = import.meta.env.VITE_LLM_BASE_URL as string | undefined

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
    envConfigured() {
      return !!envLlmApiKey?.trim()
    },
    /** 实际使用的 API Key（环境变量优先） */
    resolvedApiKey() {
      return envLlmApiKey?.trim() || this.apiKey || ''
    },
    /** 实际使用的 Base URL（环境变量优先，custom 时用 baseUrl） */
    resolvedBaseUrl() {
      if (envLlmBaseUrl?.trim())
        return envLlmBaseUrl.trim().replace(/\/$/, '')
      if (this.provider === 'custom')
        return this.baseUrl?.trim().replace(/\/$/, '') || ''
      return LLM_PROVIDERS[this.provider].baseUrl.replace(/\/$/, '')
    },
    /** 实际使用的模型 ID */
    resolvedModel() {
      if (this.model)
        return this.model
      const preset = LLM_PROVIDERS[this.provider]?.models[0]?.value
      return preset || 'deepseek-chat'
    },
    /** 是否已配置 API Key（用于初始化流程） */
    configured() {
      return !!envLlmApiKey?.trim() || !!this.apiKey
    },
    /** 当前 provider 的模型选项（custom 为空） */
    providerModels() {
      return LLM_PROVIDERS[this.provider]?.models ?? []
    },
    /** 是否为 custom provider，需要显示 baseUrl 输入框 */
    customProvider() {
      return this.provider === 'custom'
    },
  },
  actions: {
    /** 根据当前配置创建 AI 模型实例 */
    createModel(): LanguageModel {
      const apiKey = this.resolvedApiKey
      if (!apiKey?.trim())
        throw new Error('请先在设置中配置 LLM API Key')
      return createOpenAI({
        apiKey,
        baseURL: this.resolvedBaseUrl?.trim().replace(/\/$/, '') || undefined,
      }).chat(this.resolvedModel || 'deepseek-chat')
    },

    /** 流式生成文本（report 等），通过 onDelta 回调实时推送增量，返回最终完整文本 */
    async streamGenerate(systemPrompt: string, onDelta?: (delta: string) => void): Promise<string> {
      let full = ''
      const { textStream } = streamText({
        model: this.createModel(),
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
    async streamChat(options: CreateStreamOptions): Promise<void> {
      const { messagesForModel, abortSignal, callbacks, instructions } = options

      const agent = new ToolLoopAgent({
        model: this.createModel(),
        instructions: instructions.filter(Boolean) as SystemModelMessage[],
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

    /** 根据对话内容生成会话标题 */
    async generateTitle(conversationText: string): Promise<string> {
      const { text } = await generateText({
        model: this.createModel(),
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
