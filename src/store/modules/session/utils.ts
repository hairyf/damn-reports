import type { UIMessage } from 'ai'
import { generateId } from 'ai'

export function buildSessionTitleFromFirstUserMessage(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (!normalized)
    return '新会话'
  return normalized.slice(0, 24)
}

export function mergeStreamedMessage(messages: UIMessage[], message: UIMessage) {
  const index = messages.findIndex(m => m.id === message.id)
  if (index === -1) {
    messages.push(message)
    return
  }
  messages[index] = { ...messages[index], ...message }
}

export function ensureLastMessage(messages: UIMessage[], text: string) {
  const lastMessage = messages.at(-1)
  if (lastMessage?.role !== 'assistant') {
    messages.push({
      id: generateId(),
      role: 'assistant',
      parts: [
        { type: 'text', text },
      ],
    })
    return
  }
  if (lastMessage.parts.some(part => part.type === 'text' && part.text === text))
    return
  lastMessage.parts.push({ type: 'text', text })
}

export function getAssistantLastMessageMarkdown(messages: UIMessage[]): string {
  const message = messages.at(-1)
  if (message?.role !== 'assistant')
    return ''
  const textParts = message.parts.filter(part => part.type === 'text')
  return textParts.map(part => part.text).join('\n\n').trim()
}
