import type { LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { MAX_DATA_SIZE } from './types'

export function stringifyData(data: unknown): string | undefined {
  if (!data)
    return undefined
  const json = typeof data === 'string' ? data : JSON.stringify(data)
  if (json.length > MAX_DATA_SIZE)
    return `${json.slice(0, MAX_DATA_SIZE)}...`
  return json
}

export interface LlmConfig {
  llmApiKey: string
  llmBaseUrl?: string
  llmModel?: string
}

export function createModel(config: LlmConfig): LanguageModel {
  const { llmApiKey, llmBaseUrl, llmModel } = config
  if (!llmApiKey?.trim()) {
    throw new Error('请先在设置中配置 LLM API Key')
  }
  return createOpenAI({
    apiKey: llmApiKey,
    baseURL: llmBaseUrl?.trim().replace(/\/$/, '') || undefined,
  }).chat(llmModel || 'deepseek-chat')
}
