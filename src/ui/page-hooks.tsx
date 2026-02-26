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
import { exportCron, importCron } from '@/tools/workspace-archive'
import { HookItem } from './hook-item'

const PAYLOAD_LABELS: Record<string, string> = {
  collect: '收集数据',
  report: '生成报告',
  reportEnd: '日报生成后',
  agentTurn: 'AI 对话',
  command: '执行命令',
}

export function PageHooks() {
  const navigate = useNavigate()
  const { jobs } = useStore(store.cron)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const visibleJobs = useMemo(() => jobs.filter(job => job.view !== false), [jobs])

  const filteredJobs = useMemo(() => {
    if (!debouncedSearch)
      return visibleJobs
    const q = debouncedSearch.toLowerCase()
    return visibleJobs.filter(job =>
      job.name.toLowerCase().includes(q)
      || job.description?.toLowerCase().includes(q)
      || job.id.toLowerCase().includes(q)
      || (PAYLOAD_LABELS[job.payload.kind] ?? job.payload.kind).toLowerCase().includes(q),
    )
  }, [visibleJobs, debouncedSearch])

  function goSearchHook() {
    store.chat.prepareNew()
    navigate('/chat?intent=search-hook')
  }

  async function onExport(jobId: string) {
    try {
      const ok = await exportCron(jobId)
      if (ok)
        addToast({ title: '导出成功', description: '该 Hook 已保存为 .cron 文件', color: 'success' })
    }
    catch (e) {
      addToast({ title: '导出失败', description: String(e), color: 'danger' })
    }
  }

  async function onImport() {
    try {
      const ok = await importCron()
      if (ok) {
        store.cron.stop()
        await store.cron.start()
        addToast({ title: '导入成功', description: '已合并定时任务并刷新', color: 'success' })
      }
    }
    catch (e) {
      addToast({ title: '导入失败', description: String(e), color: 'danger' })
    }
  }

  return (
    <>
      <Card className="mb-4 flex-shrink-0" shadow="none">
        <CardBody className="gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="搜索 Hook..."
              value={search}
              onValueChange={setSearch}
              startContent={<Icon icon="lucide:search" className="text-default-400" />}
              className="flex-1"
            />
            <Button
              color="primary"
              onPress={goSearchHook}
              startContent={<Icon icon="lucide:bot-message-square" className="w-4 h-4" />}
            >
              添加钩子
            </Button>
            <Button
              variant="flat"
              onPress={() => store.cron.sync()}
              startContent={<Icon icon="lucide:refresh-cw" className="w-4 h-4" />}
            >
              刷新
            </Button>
            <Button
              variant="flat"
              onPress={onImport}
              startContent={<Icon icon="lucide:download" className="w-4 h-4" />}
            >
              从 .cron 导入
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="space-y-3">
        <If cond={filteredJobs.length > 0}>
          <Then>
            {filteredJobs.map(job => (
              <HookItem
                key={job.id}
                job={job}
                onExport={onExport}
              />
            ))}
          </Then>
          <Else>
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Icon icon="lucide:webhook" className="w-18 h-18 text-default-400" />
              <p className="text-default-500 text-center">
                {debouncedSearch ? '没有找到匹配的 Hook' : '暂无 Hook，点击上方添加钩子创建'}
              </p>
            </div>
          </Else>
        </If>
      </div>
    </>
  )
}
