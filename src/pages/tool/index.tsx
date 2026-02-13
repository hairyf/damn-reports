import { Else, If, Then, useDebounce } from '@hairy/react-lib'
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useMemo } from 'react'
import { useStore } from 'valtio-define'
import { store } from '@/store'

function Page() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { raw } = useStore(store.tool)

  const tools = useMemo(() => {
    const entries = Object.entries(raw).map(([id, def]) => ({ id, ...def }))
    if (!debouncedSearch)
      return entries.filter(t => t.enable !== false)
    const q = debouncedSearch.toLowerCase()
    return entries.filter(t =>
      t.enable !== false
      && (t.id.toLowerCase().includes(q)
        || t.name.toLowerCase().includes(q)
        || t.description?.toLowerCase().includes(q)),
    )
  }, [raw, debouncedSearch])

  async function onRefresh() {
    await store.tool.sync()
  }

  return (
    <>
      <Card className="mb-4 flex-shrink-0" shadow="none">
        <CardBody className="gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="搜索工具..."
              value={search}
              onValueChange={setSearch}
              startContent={<Icon icon="lucide:search" className="text-default-400" />}
              className="flex-1"
            />
            <Button
              color="primary"
              onPress={() => {
                store.chat.prepareNewChat()
                navigate('/chat?intent=add-tool')
              }}
              startContent={<Icon icon="lucide:bot-message-square" className="w-4 h-4" />}
            >
              添加配置
            </Button>
            <Button
              variant="flat"
              onPress={onRefresh}
              startContent={<Icon icon="lucide:refresh-cw" className="w-4 h-4" />}
            >
              刷新
            </Button>
          </div>
        </CardBody>
      </Card>
      <div className="space-y-3">
        <If cond={tools.length > 0}>
          <Then>
            {tools.map(tool => (
              <Card key={tool.id} shadow="none">
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
                  </div>
                </CardBody>
              </Card>
            ))}
          </Then>
          <Else>
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Icon icon="lucide:wrench" className="w-18 h-18 text-default-400" />
              <p className="text-default-500 text-center">
                {debouncedSearch ? '没有找到匹配的工具' : '暂无可用工具'}
              </p>
            </div>
          </Else>
        </If>
      </div>
    </>
  )
}

export default Page
