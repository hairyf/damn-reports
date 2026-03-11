import type { Tool } from '@/store/modules/tool'
import {
  Button,
  Card,
  CardBody,
  Chip,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { ToolIcon } from '@/components/tool-icon'

/** 列表项用的 tool 结构（id 来自 key，其余字段可能与 store 只读兼容） */
export type ToolItemTool = Omit<Tool, 'files'> & { id: string, files?: readonly string[] }

export interface ToolItemProps {
  tool: ToolItemTool
  onExport: (toolId: string) => void
  canExport?: boolean
}

export function ToolItem({ tool, onExport, canExport = true }: ToolItemProps) {
  return (
    <Card shadow="none">
      <CardBody>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <ToolIcon type={tool.id} size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{tool.name}</span>
              <Chip size="sm" variant="flat" color="default" className="text-xs">
                {tool.id}
              </Chip>
              <Chip
                size="sm"
                variant="flat"
                color={tool.type === 'exec' ? 'secondary' : 'primary'}
                className="text-xs"
              >
                {tool.type}
              </Chip>
            </div>
            <p className="text-sm text-default-500 mt-1 truncate">
              {tool.description}
            </p>
          </div>
          {canExport && (
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => onExport(tool.id)}
              title="导出为 .tool"
            >
              <Icon icon="lucide:upload" className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
