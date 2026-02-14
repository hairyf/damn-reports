import type { CronJob, CronJobCreate } from '@/cron/types'
import { Else, If, Then, useDebounce } from '@hairy/react-lib'
import {
  Button,
  Card,
  CardBody,
  Input,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useMemo } from 'react'
import { useStore } from 'valtio-define'
import { CronForm } from '@/components/cron-form'
import { store } from '@/store'
import { HookItem } from './hook-item'

const PAYLOAD_LABELS: Record<string, string> = {
  collect: '收集数据',
  report: '生成报告',
  agentTurn: 'AI 对话',
  command: '执行命令',
}

export function PageHooks() {
  const navigate = useNavigate()
  const { jobs } = useStore(store.cron)
  const [search, setSearch] = useState('')
  const [editingJob, setEditingJob] = useState<CronJob | null>(null)
  const debouncedSearch = useDebounce(search, 300)

  const filteredJobs = useMemo(() => {
    if (!debouncedSearch)
      return jobs
    const q = debouncedSearch.toLowerCase()
    return jobs.filter(job =>
      job.name.toLowerCase().includes(q)
      || job.description?.toLowerCase().includes(q)
      || job.id.toLowerCase().includes(q)
      || (PAYLOAD_LABELS[job.payload.kind] ?? job.payload.kind).toLowerCase().includes(q),
    )
  }, [jobs, debouncedSearch])

  function goSearchHook() {
    store.chat.prepareNew()
    navigate('/chat?intent=search-hook')
  }

  async function handleEdit(data: CronJobCreate) {
    if (!editingJob)
      return
    await store.cron.update(editingJob.id, data)
    setEditingJob(null)
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
              startContent={<Icon icon="lucide:plus" className="w-4 h-4" />}
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

      {/* Edit form */}
      {editingJob && (
        <CronForm
          isOpen={!!editingJob}
          onClose={() => setEditingJob(null)}
          onSubmit={handleEdit}
          initial={editingJob}
        />
      )}
    </>
  )
}
