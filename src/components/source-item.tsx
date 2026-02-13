import type { Source } from '@/store/modules/source'
import {
  Button,
  Card,
  CardBody,
  Switch,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useOverlay } from '@overlastic/react'
import { store } from '@/store'

export interface SourceItemProps {
  item: Source
  onDeleted?: (id: string) => void
}

export function SourceItem(props: SourceItemProps) {
  const navigate = useNavigate()
  const openDialog = useOverlay(Dialog)
  const { item } = props

  async function onToggleEnable(enabled: boolean) {
    await store.source.update(item.id, { enable: enabled })
  }

  async function onDelete() {
    await openDialog({
      title: '删除数据源',
      message: '确定要删除这个数据源吗？此操作无法撤销。',
      confirmText: '删除',
    })
    await store.source.remove(item.id)
    queryClient.invalidateQueries({ queryKey: ['sources'] })
    props.onDeleted?.(item.id)
  }
  return (
    <Card shadow="none">
      <CardBody>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <ToolIcon type={item.tool} size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.name}</span>
            </div>
            <div className="text-sm text-default-500">
              {item.tool}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              size="sm"
              isSelected={item.enable !== false}
              onValueChange={onToggleEnable}
            />
            <Button
              size="sm"
              variant="light"
              onPress={() => navigate(`/source/detail?id=${encodeURIComponent(item.id)}`)}
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
