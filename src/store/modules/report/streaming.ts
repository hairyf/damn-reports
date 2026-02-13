import type { LanguageModel } from 'ai'
import { streamText } from 'ai'

/** 流式生成文本，通过 onDelta 回调实时推送增量，返回最终完整文本 */
export async function streamGenerateContent(
  model: LanguageModel,
  systemPrompt: string,
  onDelta?: (delta: string) => void,
): Promise<string> {
  let full = ''
  const { textStream } = streamText({
    model,
    system: systemPrompt,
    prompt: '',
  })
  for await (const delta of textStream) {
    full += delta
    onDelta?.(delta)
  }
  return full
}
