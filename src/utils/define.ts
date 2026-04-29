import type { LanguageModel, ToolLoopAgent, ToolLoopAgentSettings } from 'ai'
import { deepseek } from '@ai-sdk/deepseek'

export interface DefineAgentOptions {
  setup: (model: LanguageModel, settings?: Omit<ToolLoopAgentSettings, 'model'>) => ToolLoopAgent | Promise<ToolLoopAgent>
}

export interface Agent {
  (settings?: Omit<ToolLoopAgentSettings, 'model'>): ToolLoopAgent | Promise<ToolLoopAgent>
}

export function defineAgent({ setup }: DefineAgentOptions): Agent {
  return async (settings?: Omit<ToolLoopAgentSettings, 'model'>) => setup(deepseek('deepseek-chat'), settings)
}
