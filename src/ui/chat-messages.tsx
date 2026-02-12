import { Button, Chip, ScrollShadow } from '@heroui/react'
import { Icon } from '@iconify/react'
import {
  Message,
  MessageActions,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageContent,
  MessageResponse,
  MessageToolbar,
  Spinner,
} from 'ai-elements'
import { useEffect, useRef } from 'react'
import { useStore } from 'valtio-define'
import { store } from '@/store'

export function ChatMessages() {
  const { activeSession, isStreaming } = useStore(store.session)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeSession?.id, activeSession?.messages])

  if (!activeSession || activeSession.messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center text-default-400">
        <Icon icon="lucide:messages-square" className="size-16" />
        <div className="text-sm">
          开始发送第一条消息，创建你的会话。
        </div>
      </div>
    )
  }

  return (
    <ScrollShadow className="h-full pr-2 pb-2">
      {activeSession.messages.map((message, index) => {
        const isLastMessage = index === activeSession.messages.length - 1
        const isAssistantLoading = message.role === 'assistant'
          && !message.content
          && isStreaming
          && isLastMessage
        const isCurrentMessageStreaming = message.role === 'assistant' && isLastMessage && isStreaming
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
                            {message.toolCalls && message.toolCalls.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs text-default-400">
                                <Icon icon="lucide:wrench" className="size-3.5" />
                                <span>使用了工具:</span>
                                {message.toolCalls.map((toolCall, idx) => (
                                  <Chip
                                    key={idx}
                                    size="sm"
                                    variant="flat"
                                    color="default"
                                    className="text-xs h-5"
                                  >
                                    {toolCall.toolName}
                                  </Chip>
                                ))}
                              </div>
                            )}
                          </div>
                        </MessageBranchContent>
                        <MessageToolbar className="mt-0">
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
                        </MessageToolbar>
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
  )
}
