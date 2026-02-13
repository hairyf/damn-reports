import { Card, CardBody, Chip, ScrollShadow } from '@heroui/react'
import { Icon } from '@iconify/react'
import {
  Message,
  // MessageActions,
  MessageBranch,
  MessageBranchContent,
  // MessageBranchNext,
  // MessageBranchPage,
  // MessageBranchPrevious,
  // MessageBranchSelector,
  MessageContent,
  MessageResponse,
  // MessageToolbar,
  Spinner,
} from 'ai-elements'
import { useEffect, useRef } from 'react'
import { useStore } from 'valtio-define'
import { store } from '@/store'
import { MAIN_SESSION_ID } from '@/store/modules/chat'
import { ChatToolItem } from './chat-tool-item'

export function ChatMessages() {
  const { activeSession, isStreaming } = useStore(store.chat)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeSession?.id, activeSession?.messages])

  const content = (!activeSession || activeSession.messages.length === 0)
    ? (
        <div className="h-full relative flex flex-col items-center justify-center gap-3 text-center text-default-400">
          <Icon icon="lucide:messages-square" className="size-16" />
          <div className="text-sm">
            开始发送第一条消息，创建你的会话。
          </div>
        </div>
      )
    : (
        <div className="h-full relative">
          <ScrollShadow className="h-full">
            {activeSession.messages.map((message, index) => {
              const isLastMessage = index === activeSession.messages.length - 1
              const isAssistantLoading = message.role === 'assistant'
                && !message.content
                && isStreaming
                && isLastMessage
              // const isCurrentMessageStreaming = message.role === 'assistant' && isLastMessage && isStreaming
              const contentClassName = 'max-w-[75%] text-sm whitespace-pre-wrap group-[.is-user]:rounded-2xl group-[.is-user]:px-3 group-[.is-user]:py-2 group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground'

              return (
                <Message key={message.id} from={message.role} className="mb-3">
                  <MessageContent className={contentClassName}>
                    {isAssistantLoading
                      ? (
                          <div className="flex items-center gap-2">
                            <Spinner className="size-4" />
                            <span>加载中...</span>
                          </div>
                        )
                      : message.role === 'assistant' && message.content
                        ? (
                            <MessageBranch>
                              <MessageBranchContent>
                                <div key={message.id}>
                                  <MessageResponse>{message.content}</MessageResponse>
                                  <ChatToolItem message={message as any} sessionId={activeSession.id} />
                                </div>
                              </MessageBranchContent>
                              {/* <MessageToolbar className="mt-0">
                          <MessageBranchSelector>
                            <MessageBranchPrevious />
                            <MessageBranchPage />
                            <MessageBranchNext />
                          </MessageBranchSelector>
                          {!isCurrentMessageStreaming && (
                            <MessageActions>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => navigator.clipboard.writeText(message.content ?? '')}
                              >
                                <Icon icon="lucide:copy" className="size-3.5" />
                              </Button>
                            </MessageActions>
                          )}
                        </MessageToolbar> */}
                            </MessageBranch>
                          )
                        : (
                            <span>{message.content}</span>
                          )}
                  </MessageContent>
                </Message>
              )
            })}
            <div ref={messagesEndRef} />
          </ScrollShadow>
        </div>
      )

  return (
    <Card shadow="none" className="flex-1 min-h-0 rounded-xl overflow-hidden">
      <CardBody className="p-6 pr-3">
        <Chip size="sm" variant="flat" color="primary" className="absolute z-10 px-2 py-1 text-xs text-default-400 bg-default-100/80 rounded-br">
          {activeSession?.id === MAIN_SESSION_ID ? '主会话' : '子会话'}
        </Chip>
        {content}
      </CardBody>
    </Card>
  )
}
