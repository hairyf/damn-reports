import type { CronJobCreate, CronPayload, CronSchedule } from '@/cron/types'
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react'

interface CronFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CronJobCreate) => void
  initial?: Partial<CronJobCreate>
}

const SCHEDULE_KINDS = [
  { key: 'cron', label: 'Cron 表达式' },
  { key: 'every', label: '固定间隔' },
  { key: 'at', label: '一次性' },
]

const PAYLOAD_KINDS = [
  { key: 'collect', label: '收集数据' },
  { key: 'report', label: '生成报告' },
  { key: 'agentTurn', label: 'AI 对话' },
  { key: 'command', label: '执行命令' },
]

const INTERVAL_PRESETS = [
  { key: '60000', label: '1 分钟' },
  { key: '300000', label: '5 分钟' },
  { key: '900000', label: '15 分钟' },
  { key: '1800000', label: '30 分钟' },
  { key: '3600000', label: '1 小时' },
  { key: '86400000', label: '1 天' },
]

export function CronForm({ isOpen, onClose, onSubmit, initial }: CronFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [scheduleKind, setScheduleKind] = useState<string>(initial?.schedule?.kind ?? 'cron')
  const [cronExpr, setCronExpr] = useState(
    initial?.schedule?.kind === 'cron' ? initial.schedule.expr : '0 18 * * 1-5',
  )
  const [everyMs, setEveryMs] = useState(
    initial?.schedule?.kind === 'every' ? String(initial.schedule.everyMs) : '3600000',
  )
  const [atTime, setAtTime] = useState(
    initial?.schedule?.kind === 'at' ? initial.schedule.at : '',
  )
  const [payloadKind, setPayloadKind] = useState<string>(initial?.payload?.kind ?? 'collect')
  const [agentMessage, setAgentMessage] = useState(
    initial?.payload?.kind === 'agentTurn' ? initial.payload.message : '',
  )
  const [command, setCommand] = useState(
    initial?.payload?.kind === 'command' ? initial.payload.command : '',
  )

  function buildSchedule(): CronSchedule {
    switch (scheduleKind) {
      case 'every':
        return { kind: 'every', everyMs: Number(everyMs) || 3600000 }
      case 'at':
        return { kind: 'at', at: atTime || new Date().toISOString() }
      default:
        return { kind: 'cron', expr: cronExpr, tz: 'Asia/Shanghai' }
    }
  }

  function buildPayload(): CronPayload {
    switch (payloadKind) {
      case 'report':
        return { kind: 'report' }
      case 'agentTurn':
        return { kind: 'agentTurn', message: agentMessage }
      case 'command':
        return { kind: 'command', command }
      default:
        return { kind: 'collect' }
    }
  }

  function handleSubmit() {
    if (!name.trim())
      return
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      enabled: true,
      schedule: buildSchedule(),
      payload: buildPayload(),
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={open => !open && onClose()} size="lg">
      <ModalContent>
        <ModalHeader>{initial ? '编辑 Hook' : '新建 Hook'}</ModalHeader>
        <ModalBody className="gap-4">
          <Input
            label="名称"
            placeholder="例如：每日数据收集"
            value={name}
            onValueChange={setName}
            isRequired
          />
          <Input
            label="描述"
            placeholder="可选描述"
            value={description}
            onValueChange={setDescription}
          />

          {/* Schedule */}
          <Select
            label="调度方式"
            selectedKeys={[scheduleKind]}
            onSelectionChange={keys => setScheduleKind([...keys][0] as string)}
          >
            {SCHEDULE_KINDS.map(s => (
              <SelectItem key={s.key}>{s.label}</SelectItem>
            ))}
          </Select>

          {scheduleKind === 'cron' && (
            <Input
              label="Cron 表达式"
              placeholder="0 18 * * 1-5"
              value={cronExpr}
              onValueChange={setCronExpr}
              description="分 时 日 月 周 (支持秒级: 秒 分 时 日 月 周)"
            />
          )}
          {scheduleKind === 'every' && (
            <Select
              label="执行间隔"
              selectedKeys={[everyMs]}
              onSelectionChange={keys => setEveryMs([...keys][0] as string)}
            >
              {INTERVAL_PRESETS.map(p => (
                <SelectItem key={p.key}>{p.label}</SelectItem>
              ))}
            </Select>
          )}
          {scheduleKind === 'at' && (
            <Input
              label="执行时间"
              type="datetime-local"
              value={atTime}
              onValueChange={setAtTime}
            />
          )}

          {/* Payload */}
          <Select
            label="执行动作"
            selectedKeys={[payloadKind]}
            onSelectionChange={keys => setPayloadKind([...keys][0] as string)}
          >
            {PAYLOAD_KINDS.map(p => (
              <SelectItem key={p.key}>{p.label}</SelectItem>
            ))}
          </Select>

          {payloadKind === 'agentTurn' && (
            <Textarea
              label="AI 消息"
              placeholder="发送给 AI 的消息内容"
              value={agentMessage}
              onValueChange={setAgentMessage}
            />
          )}
          {payloadKind === 'command' && (
            <Textarea
              label="命令"
              placeholder="要执行的 shell 命令"
              value={command}
              onValueChange={setCommand}
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>取消</Button>
          <Button color="primary" onPress={handleSubmit} isDisabled={!name.trim()}>
            {initial ? '保存' : '创建'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
