import type { CronJobCreate, CronPayload, CronSchedule } from '@/cron/types'
import { useWhenever } from '@hairy/react-lib'
import {
  addToast,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useForm } from 'react-hook-form'
import { useStore } from 'valtio-define'
import { store } from '@/store'

const SCHEDULE_KINDS = [
  { key: 'workday', label: '工作日' },
  { key: 'cron', label: 'Cron 表达式' },
  { key: 'every', label: '固定间隔' },
  { key: 'at', label: '一次性' },
  { key: 'reportend', label: '日报生成后' },
]

const PAYLOAD_KINDS = [
  { key: 'collect', label: '收集数据' },
  { key: 'report', label: '生成报告' },
  { key: 'mainagent', label: 'AI 对话' },
  { key: 'command', label: '执行命令' },
]

const REPORT_END_TRIGGERS = [
  { key: 'every', label: '每一次' },
  { key: 'scheduled', label: '仅定时触发' },
]

const INTERVAL_PRESETS = [
  { key: '60000', label: '1 分钟' },
  { key: '300000', label: '5 分钟' },
  { key: '900000', label: '15 分钟' },
  { key: '1800000', label: '30 分钟' },
  { key: '3600000', label: '1 小时' },
  { key: '86400000', label: '1 天' },
]

interface HookFormValues {
  name: string
  description: string
  scheduleKind: string
  workdayTime: string
  cronExpr: string
  everyMs: string
  atTime: string
  reportEndTrigger: string
  reportEndCommand: string
  payloadKind: string
  agentMessage: string
  command: string
}

function formatAtForInput(iso?: string): string {
  if (!iso)
    return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime()))
    return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

function getDefaultValues(job?: { name: string, description?: string, schedule: CronSchedule, payload: CronPayload } | null): HookFormValues {
  const sch = job?.schedule
  const reportEndSch = sch?.kind === 'reportend' ? sch : null
  return {
    name: job?.name ?? '',
    description: job?.description ?? '',
    scheduleKind: sch?.kind ?? 'workday',
    workdayTime: sch?.kind === 'workday' ? sch.time : '18:00',
    cronExpr: sch?.kind === 'cron' ? sch.expr : '0 18 * * 1-5',
    everyMs: sch?.kind === 'every' ? String(sch.everyMs) : '3600000',
    atTime: sch?.kind === 'at' ? formatAtForInput(sch.at) : '',
    reportEndTrigger: reportEndSch?.trigger ?? 'every',
    reportEndCommand: job?.payload?.kind === 'command' && sch?.kind === 'reportend' ? job.payload.command : '',
    payloadKind: job?.payload?.kind ?? 'collect',
    agentMessage: job?.payload?.kind === 'mainagent' ? (job.payload as { message: string }).message : '',
    command: job?.payload?.kind === 'command' ? (job.payload as { command: string }).command : '',
  }
}

function Page() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')
  const { jobs } = useStore(store.cron)

  const job = id ? jobs.find(j => j.id === id) : null

  const form = useForm<HookFormValues>({
    defaultValues: getDefaultValues(job),
  })

  useWhenever(job, j => form.reset(getDefaultValues(j)), { immediate: true })

  const scheduleKind = form.watch('scheduleKind')
  const payloadKind = form.watch('payloadKind')

  function buildSchedule(values: HookFormValues): CronSchedule {
    switch (values.scheduleKind) {
      case 'workday':
        return { kind: 'workday', time: values.workdayTime || '18:00', region: 'CN' }
      case 'every':
        return { kind: 'every', everyMs: Number(values.everyMs) || 3600000 }
      case 'at':
        return { kind: 'at', at: values.atTime || new Date().toISOString() }
      case 'reportend':
        return {
          kind: 'reportend',
          trigger: (values.reportEndTrigger === 'scheduled' ? 'scheduled' : 'every') as 'every' | 'scheduled',
        }
      case 'cron':
        return { kind: 'cron', expr: values.cronExpr, tz: 'Asia/Shanghai' }
      default:
        return { kind: 'cron', expr: values.cronExpr, tz: 'Asia/Shanghai' }
    }
  }

  function buildPayload(values: HookFormValues): CronPayload {
    if (values.scheduleKind === 'reportend')
      return { kind: 'command', command: values.reportEndCommand?.trim() || '' }
    switch (values.payloadKind) {
      case 'report':
        return { kind: 'report' }
      case 'mainagent':
        return { kind: 'mainagent', message: values.agentMessage }
      case 'command':
        return { kind: 'command', command: values.command }
      default:
        return { kind: 'collect' }
    }
  }

  function goBack() {
    navigate('/tool', { replace: true })
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!values.name.trim())
      return
    if (values.scheduleKind === 'reportend' && !values.reportEndCommand?.trim()) {
      addToast({ title: '错误', description: '请输入执行命令', color: 'danger' })
      return
    }
    if (!id) {
      addToast({ title: '错误', description: '缺少 Hook ID', color: 'danger' })
      return
    }
    const data: CronJobCreate = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      enabled: job?.enabled ?? true,
      schedule: buildSchedule(values),
      payload: buildPayload(values),
    }
    await store.cron.update(id, data)
    addToast({ title: '成功', description: 'Hook 已更新', color: 'success', timeout: 500 })
    goBack()
  })

  if (id && !job) {
    return (
      <div className="max-w-2xl w-full mx-auto p-4">
        <p className="text-default-500">
          未找到 Hook，请
          {' '}
          <button
            type="button"
            className="text-primary underline"
            onClick={() => navigate('/tool', { replace: true })}
          >
            返回
          </button>
        </p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="max-w-2xl w-full mx-auto">
        <div className="ml-2.5 mb-2">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold">
                编辑 Hook
              </h3>
              <span className="text-sm text-default-500">
                配置定时任务的调度与执行动作。
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                color="default"
                variant="light"
                radius="full"
                onPress={goBack}
              >
                返回
              </Button>
              <Button
                type="submit"
                color="primary"
                radius="full"
                className="flex-1"
                isDisabled={!form.watch('name')?.trim()}
                startContent={<Icon icon="lucide:save" className="w-4 h-4" />}
              >
                保存
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Card shadow="none">
            <CardHeader className="flex gap-1">
              <Icon icon="lucide:info" className="text-lg mt-0.3" />
              <p className="text-md">基本信息</p>
            </CardHeader>
            <Divider className="opacity-30 shadow" />
            <CardBody className="flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    rules={{ required: '请输入名称' }}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>名称</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="例如：每日数据收集"
                            labelPlacement="outside-top"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>描述</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            placeholder="可选描述"
                            labelPlacement="outside-top"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card shadow="none">
            <CardHeader className="flex gap-1">
              <Icon icon="lucide:settings" className="text-lg mt-0.3" />
              <p className="text-md">参数配置</p>
            </CardHeader>
            <Divider className="opacity-30 shadow" />
            <CardBody className="flex flex-col gap-4">
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="scheduleKind"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>调度方式</FormLabel>
                      <FormControl>
                        <Select
                          selectedKeys={field.value ? [field.value] : []}
                          onSelectionChange={keys => field.onChange([...keys][0] as string)}
                          labelPlacement="outside-top"
                        >
                          {SCHEDULE_KINDS.map(s => (
                            <SelectItem key={s.key}>{s.label}</SelectItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {scheduleKind === 'workday' && (
                  <FormField
                    control={form.control}
                    name="workdayTime"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>执行时间</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="time"
                            placeholder="18:00"
                            labelPlacement="outside-top"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {scheduleKind === 'cron' && (
                  <FormField
                    control={form.control}
                    name="cronExpr"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Cron 表达式</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="0 18 * * 1-5"
                            description="分 时 日 月 周 (支持秒级: 秒 分 时 日 月 周)"
                            labelPlacement="outside-top"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {scheduleKind === 'every' && (
                  <FormField
                    control={form.control}
                    name="everyMs"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>执行间隔</FormLabel>
                        <FormControl>
                          <Select
                            selectedKeys={field.value ? [field.value] : []}
                            onSelectionChange={keys => field.onChange([...keys][0] as string)}
                            labelPlacement="outside-top"
                          >
                            {INTERVAL_PRESETS.map(p => (
                              <SelectItem key={p.key}>{p.label}</SelectItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {scheduleKind === 'at' && (
                  <FormField
                    control={form.control}
                    name="atTime"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>执行时间</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            type="datetime-local"
                            labelPlacement="outside-top"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {scheduleKind === 'reportend' && (
                  <>
                    <FormField
                      control={form.control}
                      name="reportEndTrigger"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>执行时机</FormLabel>
                          <FormControl>
                            <Select
                              selectedKeys={field.value ? [field.value] : []}
                              onSelectionChange={keys => field.onChange([...keys][0] as string)}
                              labelPlacement="outside-top"
                            >
                              {REPORT_END_TRIGGERS.map(t => (
                                <SelectItem key={t.key}>{t.label}</SelectItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </>
                )}
              </div>
              {scheduleKind === 'reportend' && (
                <FormField
                  control={form.control}
                  name="reportEndCommand"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>执行命令</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="node tools/script.js"
                          description="最终执行：命令 <reportContent>"
                          labelPlacement="outside-top"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {scheduleKind !== 'reportend' && (
                <FormField
                  control={form.control}
                  name="payloadKind"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>执行动作</FormLabel>
                      <FormControl>
                        <Select
                          selectedKeys={field.value ? [field.value] : []}
                          onSelectionChange={keys => field.onChange([...keys][0] as string)}
                          labelPlacement="outside-top"
                        >
                          {PAYLOAD_KINDS.map(p => (
                            <SelectItem key={p.key}>{p.label}</SelectItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {payloadKind === 'mainagent' && (
                <FormField
                  control={form.control}
                  name="agentMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI 消息</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          placeholder="发送给 AI 的消息内容"
                          labelPlacement="outside-top"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {payloadKind === 'command' && (
                <FormField
                  control={form.control}
                  name="command"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>命令</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          placeholder="要执行的 shell 命令"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardBody>
          </Card>
        </div>
      </form>
    </Form>
  )
}

export default Page
