import { PromptInputProvider } from 'ai-elements'
import { ChatInner } from '@/ui/chat-inner'
import { ChatSessions } from '@/ui/chat-sessions'

function Page() {
  return (
    <div className="flex flex-1 min-h-0 gap-4 overflow-hidden">
      <ChatSessions />
      <PromptInputProvider>
        <ChatInner />
      </PromptInputProvider>
    </div>
  )
}

export default Page
