import type { ChatMessage } from '@/store/modules/session'
import { Badge, Chip } from '@heroui/react'
import { Icon } from '@iconify/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

interface ChatToolItemProps {
  message: Readonly<ChatMessage>
  sessionId: string
}

export function ChatToolItem({ message }: ChatToolItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!message.toolCalls || message.toolCalls.length === 0) {
    return null
  }

  const toolCallCounts = message.toolCalls.reduce((acc, toolCall) => {
    acc[toolCall.toolName] = (acc[toolCall.toolName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleToggle}
        className="flex flex-wrap items-center gap-1.5 text-xs text-default-400 hover:text-default-500 transition-colors cursor-pointer"
      >
        <Icon icon="lucide:wrench" className="size-3.5" />
        <span>使用了工具:</span>
        {Object.entries(toolCallCounts).map(([toolName, count]) => (
          <Badge
            key={toolName}
            content={count > 1 ? count : undefined}
            color="primary"
            size="sm"
            showOutline={false}
            placement="top-right"
            classNames={{
              badge: 'text-[10px]',
            }}
          >
            <Chip
              size="sm"
              variant="flat"
              color="primary"
              className="text-xs h-5"
            >
              {toolName}
            </Chip>
          </Badge>
        ))}
        <Icon
          icon={isExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'}
          className="size-3.5 ml-1"
        />
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1.5 text-xs text-default-500">
              {message.toolCalls.map((toolCall, idx) => (
                <div key={idx} className="flex items-start gap-2 pl-5">
                  <Icon icon="lucide:corner-down-right" className="size-3 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">
                      调用工具：
                      {toolCall.toolName}
                    </span>
                    {toolCall.args && Object.keys(toolCall.args).length > 0 && (
                      <div className="mt-0.5 text-[11px] opacity-70">
                        参数:
                        {' '}
                        {JSON.stringify(toolCall.args)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
