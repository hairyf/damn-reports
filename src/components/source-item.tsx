import type { Selectable } from 'kysely'
import {
  Button,
  Card,
  CardBody,
  Switch,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useOverlay } from '@overlastic/react'
import { SourceIcon } from './source-icon'

export interface SourceItemProps {
  item: Selectable<Source>
  onDeleted?: (id: string) => void
}

export function SourceItem(props: SourceItemProps) {
  const navigate = useNavigate()
  const openDialog = useOverlay(Dialog)
  const { item } = props

  async function onToggleEnabled() {
    await db.source.update(item.id, {
      enabled: !item.enabled,
      id: item.id,
    })
    queryClient.invalidateQueries({ queryKey: ['sources'] })
  }
  async function onDelete() {
    await openDialog({
      title: '删除数据源',
      message: '确定要删除这个数据源吗？此操作无法撤销。',
      confirmText: '删除',
    })
    await db.source.delete(item.id)
    queryClient.invalidateQueries({ queryKey: ['sources'] })
  }
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <SourceIcon type={item.type} size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.name}</span>
              {item.enabled && (
                <div className="bg-success size-2 rounded-full" />
              )}
            </div>
            <Ellipsis className="text-small text-default-500 max-w-[300px]">
              {item.description}
            </Ellipsis>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              size="sm"
              isSelected={item.enabled}
              onValueChange={onToggleEnabled}
            />
            <Button
              size="sm"
              variant="light"
              onPress={() => navigate(`/source/detail?id=${item.id}`)}
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
