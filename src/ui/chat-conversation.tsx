import type { UIMessage } from 'ai'

import { If } from '@hairy/react-lib'
import { Card, CardBody } from '@heroui/react'
import { Icon } from '@iconify/react'
import { Conversation, ConversationContent, Message } from 'ai-elements'
import { useStore } from 'valtio-define'

import { MessageParts } from '@/components/message-parts'
import { store } from '@/store'

export function ChatConversation() {
  const { session, status } = useStore(store.session)
  const messages = (session?.messages ?? []) as UIMessage[]

  return (
    <Card shadow="none" className="flex-1 min-h-0 rounded-xl overflow-hidden">
      <CardBody>
        <If
          cond={messages.length > 0}
          else={(
            <div className="h-full relative flex flex-col items-center justify-center gap-3 text-center text-default-400">
              <Icon icon="lucide:messages-square" className="size-16" />
              <div className="text-sm">
                开始发送第一条消息，创建你的会话。
              </div>
            </div>
          )}
        >
          <Conversation className="size-full">
            <ConversationContent className="p-0 gap-3">
              {messages.map((message, index) => {
                return (
                  <Message key={message.id} from={message.role} className="mb-3">
                    {message.parts.length
                      ? (
                          <MessageParts
                            isLastMessage={index === messages.length - 1}
                            message={message}
                            status={status}
                          />
                        )
                      : (
                          <div className="flex items-center gap-2 h-full">
                            <Icon icon="lucide:loader-circle" className="size-4 animate-spin" />
                            <span className="text-sm">加载中...</span>
                          </div>
                        )}
                  </Message>
                )
              })}
            </ConversationContent>
          </Conversation>
        </If>
      </CardBody>
    </Card>
  )
}
