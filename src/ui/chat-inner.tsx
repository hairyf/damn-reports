import { ChatConversation } from './chat-conversation'
import { ChatInput } from './chat-input'

export function ChatInner() {
  return (
    <div className="flex-1 relative">
      <div className="flex flex-col h-full absolute inset-0 overflow-hidden gap-4">
        <ChatConversation />
        <ChatInput />
      </div>
    </div>
  )
}
