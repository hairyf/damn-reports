import type { ChatStatus, UIMessage } from 'ai'
import { MessageContent, MessageResponse, Reasoning, ReasoningContent, ReasoningTrigger } from 'ai-elements'
import clsx from 'clsx'
import { Fragment } from 'react'
import { MessageTool } from './message-tool'

export function MessageParts({ message, status, isLastMessage }: { message: UIMessage, status: ChatStatus, isLastMessage: boolean }) {
  const textParts = message.parts.filter(part => part.type === 'text')
  const text = textParts.map(part => part.text).join('\n\n')
  const hasText = textParts.length > 0

  // Consolidate all reasoning parts into one block
  const reasoningParts = message.parts.filter(part => part.type === 'reasoning')
  const reasoningText = reasoningParts.map(part => part.text).join('\n\n')
  const hasReasoning = reasoningParts.length > 0

  const hasTool = message.parts.some(part => part.type === 'dynamic-tool' || part.type.startsWith('tool-'))
  return (
    <Fragment key={message.id}>
      {hasReasoning && (
        <Reasoning isStreaming={status === 'streaming' && isLastMessage} className="w-full mb-1">
          <ReasoningTrigger />
          <ReasoningContent>
            {reasoningText}
          </ReasoningContent>
        </Reasoning>
      )}

      {hasText && (
        <MessageContent
          className={clsx([
            'max-w-[75%] text-sm whitespace-pre-wrap',
            'group-[.is-user]:rounded-2xl group-[.is-user]:px-3',
            'group-[.is-user]:py-2 group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground',
          ])}
        >
          <MessageResponse>
            {text}
          </MessageResponse>
        </MessageContent>
      )}

      {hasTool && (
        <MessageTool message={message} />
      )}
    </Fragment>
  )
}
