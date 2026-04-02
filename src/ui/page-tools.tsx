import { Else, If, Then, useDebounce } from '@hairy/react-lib'
import {
  addToast,
  Button,
  Card,
  CardBody,
  Input,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useMemo } from 'react'
import { useStore } from 'valtio-define'
import { store } from '@/store'
import { exportTools, handleImportAndInstall, importTools } from '@/utils/workspace-archive'
import { ToolItem } from './tool-item'

/** 默认内置工具，不允许导出 */
const BUILTIN_TOOL_IDS = ['git_directory', 'clickup']

export function PageTools() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { raw } = useStore(store.tool)

  const tools = useMemo(() => {
    const entries = Object.entries(raw).map(([id, { id: _ignored, ...def }]) => ({ id, ...def }))
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

  async function onExport(toolId: string) {
    try {
      const ok = await exportTools(toolId)
      if (ok)
        addToast({ title: '导出成功', description: '该工具已保存为 .tool 文件', color: 'success' })
    }
    catch (e) {
      addToast({ title: '导出失败', description: String(e), color: 'danger' })
    }
  }

  async function onImport() {
    await handleImportAndInstall({
      importFn: importTools,
      refreshFn: () => store.tool.sync(),
      rollbackFn: async (ids) => {
        const next = { ...store.tool.raw }
        for (const id of ids)
          delete next[id]
        await store.tool.set(next)
      },
      successMsg: '已合并工具配置',
    })
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
                store.session.prepare()
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
            <Button
              variant="flat"
              onPress={onImport}
              startContent={<Icon icon="lucide:download" className="w-4 h-4" />}
            >
              导入
            </Button>
          </div>
        </CardBody>
      </Card>
      <div className="space-y-3">
        <If cond={tools.length > 0}>
          <Then>
            {tools.map(tool => (
              <ToolItem
                key={tool.id}
                tool={tool}
                onExport={onExport}
                canExport={!BUILTIN_TOOL_IDS.includes(tool.id)}
              />
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
