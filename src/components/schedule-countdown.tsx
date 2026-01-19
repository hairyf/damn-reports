import { Icon } from '@iconify/react'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { useEffect, useState } from 'react'
import { useStore } from 'valtio-define'
import { store } from '@/store'

dayjs.extend(duration)

export function ScheduleCountdown({ className }: { className?: string }) {
  const setting = useStore(store.setting)
  const [collectCountdown, setCollectCountdown] = useState('')
  const [generateCountdown, setGenerateCountdown] = useState('')

  // 格式化倒计时（使用 dayjs duration 的格式化）
  function formatCountdown(seconds: number) {
    return dayjs.duration(seconds, 'seconds').format('HH:mm:ss')
  }

  // 计算目标时间（如果已过今天，则计算明天）
  function getTargetTime(timeStr: string) {
    const [hour, minute] = timeStr.split(':').map(Number)
    const now = dayjs()
    let target = dayjs().hour(hour).minute(minute).second(0).millisecond(0)
    if (target.isBefore(now))
      target = target.add(1, 'day')
    return target
  }

  // 计算倒计时
  useEffect(() => {
    // 在 setInterval 回调中更新（这是允许的，根据 ESLint 规则）
    function updateCountdown() {
      const now = dayjs()
      const collectTarget = getTargetTime(setting.collectTime)
      const collectDiff = collectTarget.diff(now, 'second')
      const generateTarget = getTargetTime(setting.generateTime)
      const generateDiff = generateTarget.diff(now, 'second')

      setCollectCountdown(formatCountdown(collectDiff))
      setGenerateCountdown(formatCountdown(generateDiff))
    }

    // 立即执行一次（使用 setTimeout 包装，使其不在 useEffect 的直接执行路径中）
    const immediateTimer = setTimeout(updateCountdown, 0)
    const timer = setInterval(updateCountdown, 1000)

    return () => {
      clearTimeout(immediateTimer)
      clearInterval(timer)
    }
  }, [setting.collectTime, setting.generateTime])

  return (
    <div className={cn('flex flex-col gap-1.5 text-xs text-default-600 bg-content1/80 backdrop-blur-sm rounded-lg p-3 border border-default-200', className)}>
      <div className="flex items-center gap-1.5 text-default-500 mb-1">
        <Icon icon="lucide:calendar-clock" className="-mt-[1.2px]" fontSize={14} />
        <span className="text-xs font-medium">定时任务</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-default-500">数据收集：</span>
        <span className="font-semibold">{setting.collectTime}</span>
        <span className="text-default-400">/</span>
        <span className="text-default-500 font-mono">{collectCountdown}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-default-500">报告生成：</span>
        <span className="font-semibold">{setting.generateTime}</span>
        <span className="text-default-400">/</span>
        <span className="text-default-500 font-mono">{generateCountdown}</span>
      </div>
    </div>
  )
}
