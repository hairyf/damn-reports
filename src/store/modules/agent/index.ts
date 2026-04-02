import type { AsyncIterableStream, LanguageModel, UIMessage } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { google } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { addToast } from '@heroui/react'
import {
  convertToModelMessages,
  generateId,
  readUIMessageStream,
} from 'ai'
import { defineStore } from 'valtio-define'
import { createReportAgent } from '@/agents'
import { PROVIDERS } from './config'

export type Provider = 'deepseek' | 'openai' | 'anthropic' | 'google' | 'custom'
export type Protocol = 'openai' | 'anthropic' | 'google'

export interface Model {
  id: string
  owned_by: string
  name?: string
  description?: string
  [key: string]: any
}

export const agent = defineStore({
  state: () => ({
    provider: 'deepseek' as Provider,
    apiKey: '',
    model: 'deepseek-chat' as string,

    cutsom: {
      type: 'openai' as Protocol,
      url: '',
    },
  }),
  actions: {
    getLanguageModel(): LanguageModel {
      const handlers = {
        deepseek: createDeepSeek,
        openai: createOpenAI,
        anthropic: createAnthropic,
        google: (_: any) => google, // 统一调用签名
      }

      const isCustom = this.provider === 'custom'
      const protocol = isCustom
        ? this.cutsom.type
        : PROVIDERS[this.provider]?.protocol

      const handler = handlers[this.provider as keyof typeof handlers]

      if (!handler) {
        throw new Error(`Unsupported provider or protocol: ${protocol}`)
      }

      const config = { apiKey: this.apiKey, ...(isCustom && { baseURL: this.cutsom.url }) }

      return handler(config)(this.model)
    },

    async streamAgentUIMessage(
      messages: UIMessage[],
      abortSignal: AbortSignal,
    ): Promise<AsyncIterableStream<UIMessage>> {
      const model = this.getLanguageModel()
      const agent = await createReportAgent(model)

      const modelMessages = await convertToModelMessages(messages)
      const stream = await agent.stream({ messages: modelMessages, abortSignal })
      const uiStream = stream.toUIMessageStream({ generateMessageId: () => generateId() })

      return readUIMessageStream({
        stream: uiStream,
        onError(error: any) {
          addToast({
            title: '错误',
            description: error.message,
            color: 'danger',
          })
          store.session.clearStaleStreaming()
          store.session.stop(undefined, '系统错误，请重试')
        },
      })
    },
  },
  persist: true,
})
