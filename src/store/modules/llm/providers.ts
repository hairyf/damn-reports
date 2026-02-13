import type { LlmProvider, LlmProviderConfig } from './types'

/** Vercel AI Gateway: https://vercel.com/docs/ai-gateway，支持 200+ 模型 */
export const VERCEL_AI_GATEWAY_BASE = 'https://ai-gateway.vercel.sh/v1'
export const VERCEL_AI_GATEWAY_MODELS_URL = 'https://ai-gateway.vercel.sh/v1/models'

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

/** 从 Vercel AI Gateway API 获取完整模型列表（无需认证） */
export async function fetchVercelModels(): Promise<Array<{ value: string, label: string }>> {
  const res = await fetch(VERCEL_AI_GATEWAY_MODELS_URL)
  if (!res.ok)
    throw new Error(`Failed to fetch Vercel models: ${res.status}`)
  const json = await res.json() as { data?: Array<{ id: string, name?: string }> }
  const data = json.data ?? []
  return data.map(m => ({ value: m.id, label: m.name || m.id }))
}
