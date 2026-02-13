import type { CronJob, CronJobCreate } from '@/cron/types'
import { Else, If, Then } from '@hairy/react-lib'
import {
  Button,
  Card,
  CardBody,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Switch,
  Tooltip,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import dayjs from 'dayjs'
import { useStore } from 'valtio-define'
import { CronForm } from '@/components/cron-form'
import { store } from '@/store'

const PAYLOAD_LABELS: Record<string, string> = {
  collect: '收集数据',
  report: '生成报告',
  agentTurn: 'AI 对话',
  command: '执行命令',
}

const PAYLOAD_COLORS: Record<string, 'primary' | 'secondary' | 'success' | 'warning'> = {
  collect: 'primary',
  report: 'success',
  agentTurn: 'secondary',
  command: 'warning',
}

function formatSchedule(job: CronJob): string {
  const { schedule } = job
  if (schedule.kind === 'cron')
    return schedule.expr
  if (schedule.kind === 'every') {
    const ms = schedule.everyMs
    if (ms >= 86400000)
      return `每 ${ms / 86400000} 天`
    if (ms >= 3600000)
      return `每 ${ms / 3600000} 小时`
    if (ms >= 60000)
      return `每 ${ms / 60000} 分钟`
    return `每 ${ms / 1000} 秒`
  }
  if (schedule.kind === 'at')
    return dayjs(schedule.at).format('YYYY-MM-DD HH:mm')
  return '未知'
}

function formatNextRun(job: CronJob): string {
  if (!job.enabled)
    return '已禁用'
  if (job.state.runningAtMs)
    return '运行中...'
  if (!job.state.nextRunAtMs)
    return '无计划'
  return dayjs(job.state.nextRunAtMs).format('MM-DD HH:mm:ss')
}

function formatLastRun(job: CronJob): string {
  if (!job.state.lastRunAtMs)
    return '从未运行'
  const time = dayjs(job.state.lastRunAtMs).format('MM-DD HH:mm')
  const status = job.state.lastStatus === 'ok' ? '成功' : job.state.lastStatus === 'error' ? '失败' : '跳过'
  return `${time} (${status})`
}

function Page() {
  const { jobs } = useStore(store.cron)
  const [formOpen, setFormOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<CronJob | null>(null)

  async function handleCreate(data: CronJobCreate) {
    await store.cron.add(data)
  }

  async function handleEdit(data: CronJobCreate) {
    if (!editingJob)
      return
    await store.cron.update(editingJob.id, data)
    setEditingJob(null)
  }

  async function handleToggle(id: string) {
    await store.cron.toggle(id)
  }

  async function handleRun(id: string) {
    await store.cron.run(id)
  }

  async function handleRemove(id: string) {
    await store.cron.remove(id)
  }

  return (
    <>
      <Card className="mb-4 flex-shrink-0" shadow="none">
        <CardBody className="gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Hooks</h3>
              <p className="text-sm text-default-500">定时任务调度管理</p>
            </div>
            <Button
              color="primary"
              onPress={() => setFormOpen(true)}
              startContent={<Icon icon="lucide:plus" className="w-4 h-4" />}
            >
              新建 Hook
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
        <If cond={jobs.length > 0}>
          <Then>
            {jobs.map(job => (
              <Card key={job.id} shadow="none">
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <Switch
                        size="sm"
                        isSelected={job.enabled}
                        onValueChange={() => handleToggle(job.id)}
                        aria-label="启用/禁用"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{job.name}</span>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={PAYLOAD_COLORS[job.payload.kind] ?? 'default'}
                          className="text-xs"
                        >
                          {PAYLOAD_LABELS[job.payload.kind] ?? job.payload.kind}
                        </Chip>
                        <Chip size="sm" variant="flat" color="default" className="text-xs font-mono">
                          {formatSchedule(job)}
                        </Chip>
                      </div>
                      {job.description && (
                        <p className="text-sm text-default-500 mt-1 truncate">{job.description}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-default-400">
                        <span>
                          下次:
                          {' '}
                          {formatNextRun(job)}
                        </span>
                        <span>
                          上次:
                          {' '}
                          {formatLastRun(job)}
                        </span>
                        {job.state.lastError && (
                          <Tooltip content={job.state.lastError}>
                            <span className="text-danger cursor-help">
                              错误:
                              {' '}
                              {job.state.lastError.slice(0, 30)}
                              ...
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly variant="light" size="sm">
                            <Icon icon="lucide:more-vertical" className="w-4 h-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          aria-label="Hook 操作"
                          onAction={(key) => {
                            if (key === 'run')
                              handleRun(job.id)
                            if (key === 'edit')
                              setEditingJob(job)
                            if (key === 'remove')
                              handleRemove(job.id)
                          }}
                        >
                          <DropdownItem key="run" startContent={<Icon icon="lucide:play" className="w-4 h-4" />}>
                            立即运行
                          </DropdownItem>
                          <DropdownItem key="edit" startContent={<Icon icon="lucide:pencil" className="w-4 h-4" />}>
                            编辑
                          </DropdownItem>
                          <DropdownItem key="remove" className="text-danger" color="danger" startContent={<Icon icon="lucide:trash-2" className="w-4 h-4" />}>
                            删除
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </Then>
          <Else>
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Icon icon="lucide:webhook" className="w-18 h-18 text-default-400" />
              <p className="text-default-500 text-center">暂无 Hook，点击上方按钮创建</p>
            </div>
          </Else>
        </If>
      </div>

      {/* Create form */}
      <CronForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />

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

export default Page
