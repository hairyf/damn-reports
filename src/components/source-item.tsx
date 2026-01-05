import type { IconMap } from './source-icon'
import {
  Button,
  Card,
  CardBody,
  Switch,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { SourceIcon } from './source-icon'

export interface DataSource {
  id: string
  name: string
  type: 'local' | 'third-party'
  typeId: keyof IconMap
  enabled: boolean
}

export interface SourceItemProps {
  item: DataSource
  onDeleted?: (id: string) => void
}

export function SourceItem(props: SourceItemProps) {
  const { item } = props

  function onToggleEnabled() {
    // TODO: 实现启用/禁用逻辑
  }
  function onDelete() {
    // TODO: 实现删除逻辑
  }
  function onEdit() {
    // TODO: 实现编辑逻辑
  }
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <SourceIcon id={item.typeId} size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.name}</span>
              {item.enabled && (
                <div className="bg-success size-2 rounded-full" />
              )}
            </div>
            <p className="text-small text-default-500">heroui.com</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              size="sm"
              checked={item.enabled}
              onChange={onToggleEnabled}
            />
            <Button
              size="sm"
              variant="light"
              onPress={onEdit}
              isIconOnly
            >
              <Icon icon="lucide:edit" className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="light"
              color="danger"
              isIconOnly
              onPress={onDelete}
            >
              <Icon icon="lucide:trash" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
