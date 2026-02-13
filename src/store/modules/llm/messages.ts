import type { FileUIPart } from 'ai'
import type { ChatMessage } from '../chat/types'

/** 将聊天消息转为模型所需的格式，含附件与工具调用结果 */
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
