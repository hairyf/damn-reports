import type { UIMessage } from 'ai'
import {
  convertToModelMessages,

} from 'ai'
import { defaultAgent } from '@/ai'
// import { frontendTools } from '@assistant-ui/react-ai-sdk'

export interface ChatRequestBody {
  // tools?: Record<string, { description?: string, parameters: JSONSchema7 }>
  messages: UIMessage[]
}

export async function POST(req: Request) {
  const body: ChatRequestBody = await req.json()
  const agent = await defaultAgent()
  const messages = await convertToModelMessages(body.messages)
  return agent.stream({ messages })
}
