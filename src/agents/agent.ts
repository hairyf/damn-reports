import type { LanguageModel } from 'ai'
import { ToolLoopAgent } from 'ai'
import { buildSystemPrompt } from './prompts'
import * as tools from './tools'

export async function createReportAgent(model: LanguageModel) {
  return new ToolLoopAgent({
    model,
    instructions: [
      {
        role: 'system',
        content: await buildSystemPrompt(),
      },
    ],
    tools,
  })
}
