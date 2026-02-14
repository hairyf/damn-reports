import type { CronJob } from '@/cron/types'
import { Icon } from '@iconify/react'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { useStore } from 'valtio-define'

dayjs.extend(duration)

function getReportJobTime(jobs: readonly CronJob[]): string | null {
  const job = jobs.find(j => j.id === 'builtin_daily_report')
  if (!job || !job.enabled)
    return null
  const sch = job.schedule
  if (sch.kind === 'workday' && sch.time)
    return sch.time
  if (sch.kind === 'at' && sch.at) {
    const m = sch.at.match(/^\d{2}:\d{2}/)
    return m ? m[0] : null
  }
  if (sch.kind === 'cron' && sch.expr) {
    const parts = sch.expr.split(/\s+/)
    if (parts.length >= 2)
      return `${parts[1].padStart(2, '0')}:${parts[0].padStart(2, '0')}`
  }
  return null
}

export function ReportCountdown({ className }: { className?: string }) {
  const jobs = useStore(store.cron).jobs
  const generateTime = getReportJobTime(jobs) || '--:--'
  const [generateCountdown, setGenerateCountdown] = useState('--:--')

  // 计算倒计时
  useEffect(() => {
    // 在 setInterval 回调中更新（这是允许的，根据 ESLint 规则）
    function updateCountdown() {
      if (generateTime === '--:--')
        return
      const target = formatCountdown(generateTime)
      const diff = target.diff(dayjs(), 'second')
      setGenerateCountdown(formatDuration(diff))
    }

    // 立即执行一次（使用 setTimeout 包装，使其不在 useEffect 的直接执行路径中）
    const immediateTimer = setTimeout(updateCountdown, 0)
    const timer = setInterval(updateCountdown, 1000)

    return () => {
      clearTimeout(immediateTimer)
      clearInterval(timer)
    }
  }, [generateTime])

  return (
    <div className={cn('flex flex-col gap-1.5 text-xs text-default-600 bg-content1/80 backdrop-blur-sm rounded-lg p-2.5 border border-default-200', className)}>
      <div className="flex items-center gap-1.5 text-default-500 mb-1">
        <Icon icon="lucide:calendar-clock" className="-mt-[1.2px]" fontSize={14} />
        <span className="text-xs font-medium">定时任务</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-default-500">报告生成：</span>
        <span className="font-semibold">{generateTime}</span>
        <span className="text-default-400">/</span>
        <span className="text-default-500 font-mono">{generateCountdown}</span>
      </div>
    </div>
  )
}

// 格式化倒计时
function formatDuration(seconds: number) {
  return dayjs.duration(seconds, 'seconds').format('HH:mm:ss')
}

// 计算目标时间（如果已过今天，则计算明天）
function formatCountdown(timeStr: string) {
  const [hour, minute] = timeStr.split(':').map(Number)
  const now = dayjs()
  let target = dayjs().hour(hour).minute(minute).second(0).millisecond(0)
  if (target.isBefore(now))
    target = target.add(1, 'day')
  return target
}
