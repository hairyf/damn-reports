import { ChatInput } from '@/ui/chat-input'
import { ChatMessages } from '@/ui/chat-messages'
import { ChatSessions } from '@/ui/chat-sessions'

function Page() {
  return (
    <div className="flex flex-1 min-h-0 gap-4 overflow-hidden">
      <ChatSessions />
      <div className="flex-1 relative">
        <div className="flex flex-col h-full absolute inset-0 overflow-hidden gap-4">
          <ChatMessages />
          <ChatInput />
        </div>
      </div>
    </div>
  )
}

export default Page
