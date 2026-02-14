import type { CronJob } from '@/cron'
import {
  Button,
  Card,
  CardBody,
  Chip,
  Switch,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useMutation } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { store } from '@/store'

const PAYLOAD_LABELS: Record<string, string> = {
  collect: '数据',
  report: '报告',
  reportEnd: '日报后',
  agentTurn: '对话',
  command: '命令',
}

const PAYLOAD_COLORS: Record<string, 'primary' | 'secondary' | 'success' | 'warning'> = {
  collect: 'primary',
  report: 'success',
  reportEnd: 'success',
  agentTurn: 'secondary',
  command: 'warning',
}

function formatSchedule(job: CronJob): string {
  const { schedule } = job
  if (schedule.kind === 'workday')
    return `工作日 ${schedule.time}`
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
  if (schedule.kind === 'report-end') {
    const triggerLabel = schedule.trigger === 'scheduled' ? '仅定时' : '每次'
    return `日报后 (${triggerLabel})`
  }
  return '未知'
}

const WEEKDAY_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function formatNextRun(job: CronJob): string {
  if (!job.enabled)
    return '已禁用'
  if (job.state.runningAtMs)
    return '运行中...'
  if (job.schedule.kind === 'report-end')
    return '日报生成后'
  if (!job.state.nextRunAtMs)
    return '无计划'
  const d = dayjs(job.state.nextRunAtMs)
  const weekday = WEEKDAY_ZH[d.day()]
  return `下次 ${d.format('MM-DD HH:mm')} (${weekday})`
}

export function HookItem({ job }: { job: CronJob }) {
  async function handleToggle(id: string) {
    await store.cron.toggle(id)
  }

  const runMutation = useMutation({
    mutationFn: store.cron.run,
  })

  const removeMutation = useMutation({
    mutationFn: store.cron.remove,
  })

  return (
    <Card key={job.id} shadow="none">
      <CardBody>
        <div className="flex items-center gap-4">

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{job.name}</span>
              <Chip
                size="sm"
                variant="flat"
                color={PAYLOAD_COLORS[job.payload.kind] ?? 'default'}
                className="text-xs h-5"
              >
                {PAYLOAD_LABELS[job.payload.kind] ?? job.payload.kind}
              </Chip>
              <Chip size="sm" variant="flat" color="default" className="text-xs font-mono h-5">
                {formatSchedule(job)}
              </Chip>
              <Chip size="sm" variant="flat" color="default" className="text-xs font-mono h-5">
                {formatNextRun(job)}
              </Chip>
            </div>
            {job.description && (
              <p className="text-sm text-default-500 mt-1 truncate">{job.description}</p>
            )}
          </div>
          {/* <div className="flex gap-4 mt-2 text-xs text-default-400">
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
          </div> */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Switch
              size="sm"
              isSelected={job.enabled}
              onValueChange={() => handleToggle(job.id)}
              aria-label="启用/禁用"
            />
            <div className="flex items-center gap-1">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                isLoading={runMutation.isPending}
                onPress={() => runMutation.mutate(job.id)}
                isDisabled={job.schedule.kind === 'report-end'}
                title={job.schedule.kind === 'report-end' ? '由日报生成自动触发' : undefined}
              >
                {!runMutation.isPending
                  ? <Icon icon="lucide:play" className="w-4 h-4" />
                  : undefined}
              </Button>
              <Button
                as={Link}
                to={`/tool/hook?id=${job.id}`}
                isIconOnly
                variant="light"
                size="sm"
              >
                <Icon icon="lucide:edit" className="w-4 h-4" />
              </Button>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                color="danger"
                isLoading={removeMutation.isPending}
                onPress={() => removeMutation.mutate(job.id)}
                isDisabled={job.system}
              >
                {!removeMutation.isPending ? <Icon icon="lucide:trash-2" className="w-4 h-4" /> : undefined}
              </Button>
            </div>

            {/* <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly variant="light" size="sm">
                  <Icon icon="lucide:more-vertical" className="w-4 h-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Hook 操作"
                onAction={(key) => {
                  if (key === 'run')
                    runMutation.mutate(job.id)
                  if (key === 'edit')
                    setEditingJob(job)
                  if (key === 'remove')
                    removeMutation.mutate(job.id)
                }}
              >
                <DropdownItem key="run" startContent={<Icon icon="lucide:play" className="w-4 h-4" />}>
                  立即运行
                </DropdownItem>
                <DropdownItem key="edit" startContent={<Icon icon="lucide:edit" className="w-4 h-4" />}>
                  编辑
                </DropdownItem>
                <DropdownItem key="remove" className="text-danger" color="danger" startContent={<Icon icon="lucide:trash-2" className="w-4 h-4" />}>
                  删除
                </DropdownItem>
              </DropdownMenu>
            </Dropdown> */}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
