import type { UIMessage } from 'ai'
import { cloneDeep, isString } from '@hairy/utils'
import { Badge, Chip } from '@heroui/react'
import { Icon } from '@iconify/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'

// --- Types ---

interface ToolCallView {
  toolName: string
  args?: Record<string, unknown>
  result?: string
}

interface ChatToolProps {
  message: Readonly<UIMessage>
}

// --- Sub-components ---

/**
 * 单个工具摘要标签
 */
function ToolSummaryBadge({ name, count }: { name: string, count: number }) {
  const chip = (
    <Chip size="sm" variant="flat" color="primary" className="text-xs h-5">
      {name}
    </Chip>
  )
  return (
    count > 1
      ? (
          <Badge
            content={count > 1 ? count : undefined}
            color="primary"
            size="sm"
            showOutline={false}
            placement="top-right"
            classNames={{ badge: 'text-[10px] min-w-4 h-4' }}
          >
            {chip}
          </Badge>
        )
      : chip
  )
}

/**
 * 展开后的详细列表项
 */
function ToolDetailItem({ tool }: { tool: ToolCallView }) {
  return (
    <div className="flex items-start gap-2  py-1 border-default-100 ml-1.5">
      <Icon icon="lucide:corner-down-right" className="size-3 mt-1 shrink-0 text-default-400" />
      <div className="flex flex-col gap-2 min-w-0">
        <span className="font-medium text-sm text-default-600">
          调用:
          {tool.toolName}
        </span>

        {tool.args && Object.keys(tool.args).length > 0 && (
          <code className="text-[10px] rounded text-default-500 break-all line-clamp-2">
            参数:
            {' '}
            {JSON.stringify(tool.args)}
          </code>
        )}

        {tool.result && (
          <div className="text-[10px] text-default-500 break-all">
            结果:
            {' '}
            <pre className="">{tool.result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Main Component ---

export function MessageTool({ message }: ChatToolProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // 1. 逻辑与数据预处理
  const { toolCalls, toolCounts } = useMemo(() => {
    const calls = message.parts
      .filter(part => part.type === 'dynamic-tool' || part.type.startsWith('tool-'))
      .map((part): ToolCallView => {
        const p = cloneDeep(part as any) // 简化类型断言
        const toolName = p.type === 'dynamic-tool' ? (p.toolName ?? 'unknown') : p.type.slice(5)

        let result: string | undefined
        if (p.state === 'output-available') {
          for (const key of Object.keys(p.output)) {
            if (isString(p.output[key]) && p.output[key].length > 1000)
              p.output[key] = '<truncated>'
          }
          result = JSON.stringify(p.output, null, 2)
        }
        else if (p.state === 'output-error') {
          result = p.errorText
        }
        return { toolName, args: p.input, result }
      })

    const counts = calls.reduce<Record<string, number>>((acc, curr) => {
      acc[curr.toolName] = (acc[curr.toolName] || 0) + 1
      return acc
    }, {})

    return { toolCalls: calls, toolCounts: counts }
  }, [message.parts])

  if (toolCalls.length === 0)
    return null

  return (
    <div className="mt-2 w-full">
      {/* 交互触发层 */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex flex-wrap items-center text-xs text-default-400 hover:text-default-600 transition-colors"
      >
        <div className="flex items-center gap-1.5 mr-2">
          <Icon icon="lucide:wrench" className="size-3.5 group-hover:rotate-12 transition-transform" />
          <span className="font-medium">使用工具:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {Object.entries(toolCounts).map(([name, count]) => (
            <ToolSummaryBadge key={name} name={name} count={count} />
          ))}
        </div>

        <Icon
          icon="lucide:chevron-down"
          className={`size-3.5 ml-1 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 详情展开层 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-col gap-2 border-l-2 border-primary/10 ml-1.5">
              {toolCalls.map((tool, idx) => (
                <ToolDetailItem key={`${tool.toolName}-${idx}`} tool={tool} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
