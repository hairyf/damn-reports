export type LlmProvider = 'deepseek' | 'openai' | 'anthropic' | 'moonshot' | 'openrouter' | 'vercel' | 'custom'

export interface LlmProviderConfig {
  label: string
  baseUrl: string
  models: Array<{ value: string, label: string }>
  /** 是否支持动态加载模型列表（从 API 获取） */
  fetchModels?: boolean
}

/** 流式回调：由调用方处理文案与工具调用的更新 */
export interface StreamCallbacks {
  onTextDelta: (delta: string, opts?: { replace?: boolean, toolCallIndex?: number }) => void
  onToolCall: (toolName: string, args: Record<string, unknown>) => void
  onToolResult: () => void
}

export interface CreateStreamOptions {
  messagesForModel: Array<{ role: 'user' | 'assistant', content: string | Array<{ type: 'text', text: string } | { type: 'file', data: string, mediaType: string, filename?: string }> }>
  abortSignal: AbortController['signal']
  callbacks: StreamCallbacks
}
