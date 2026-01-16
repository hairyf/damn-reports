import { Card, CardBody, CardHeader, Divider, TimeInput } from '@heroui/react'
import { Icon } from '@iconify/react'
import { parseTime, Time } from '@internationalized/date'
import { useStore } from 'valtio-define'
import { store } from '@/store'

export function SettingAutoCard() {
  const setting = useStore(store.setting)
  // 将时间字符串转换为 Time 对象
  function stringToTime(timeStr: string): Time {
    return parseTime(timeStr)
  }

  // 将 Time 对象转换为时间字符串
  function timeToString(time: Time): string {
    return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`
  }

  // 将时间转换为分钟数（用于比较）
  function timeToMinutes(time: Time): number {
    return time.hour * 60 + time.minute
  }

  // 将分钟数转换为 Time 对象
  function minutesToTime(minutes: number): Time {
    const hours = Math.floor(minutes / 60) % 24
    const mins = minutes % 60
    return new Time(hours, mins)
  }

  // 获取当前的数据收集时间（Time 对象）
  const collectTime = stringToTime(setting.collectTime)

  // 获取当前的报告生成时间（Time 对象）
  const generateTime = stringToTime(setting.generateTime)

  // 更新数据收集时间
  function handleCollectTimeChange(value: Time | null) {
    if (!value)
      return

    const timeStr = timeToString(value)
    store.setting.$state.collectTime = timeStr

    // 检查报告生成时间是否满足要求（必须比数据收集时间大 5 分钟）
    const collectMinutes = timeToMinutes(value)
    const generateMinutes = timeToMinutes(generateTime)
    const minGenerateMinutes = collectMinutes + 5

    // 如果报告生成时间不满足要求，自动调整为最小时间
    if (generateMinutes < minGenerateMinutes) {
      const adjustedTime = minutesToTime(minGenerateMinutes)
      store.setting.$state.generateTime = timeToString(adjustedTime)
    }
  }

  // 更新报告生成时间
  function handleGenerateTimeChange(value: Time | null) {
    if (!value)
      return

    const collectMinutes = timeToMinutes(collectTime)
    const generateMinutes = timeToMinutes(value)
    const minGenerateMinutes = collectMinutes + 5

    // 验证报告生成时间必须比数据收集时间大 5 分钟
    if (generateMinutes < minGenerateMinutes) {
      // 如果不满足要求，自动调整为最小时间
      const adjustedTime = minutesToTime(minGenerateMinutes)
      store.setting.$state.generateTime = timeToString(adjustedTime)
    }
    else {
      store.setting.$state.generateTime = timeToString(value)
    }
  }

  // 检查报告生成时间是否有效
  const isGenerateTimeValid = (() => {
    const collectMinutes = timeToMinutes(collectTime)
    const generateMinutes = timeToMinutes(generateTime)
    return generateMinutes >= collectMinutes + 5
  })()

  return (
    <Card>
      <CardHeader className="flex gap-3">
        <Icon icon="lucide:workflow" className="w-5 h-5" />
        <div className="flex flex-col">
          <p className="text-md font-semibold">自动化</p>
          <p className="text-small text-default-500">自动化配置</p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="gap-4 p-5">
        {/* 数据收集时间 */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:database" className="w-4 h-4 text-default-500" />
              <label className="text-sm font-medium">数据收集时间</label>
            </div>
            <p className="text-xs text-default-400">
              每天自动收集数据的时间
            </p>
          </div>
          <div>
            <TimeInput
              value={collectTime}
              onChange={handleCollectTimeChange}
            />
          </div>
        </div>

        {/* 报告生成时间 */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:file-text" className="w-4 h-4 text-default-500" />
              <label className="text-sm font-medium">报告生成时间</label>
            </div>
            <p className="text-xs text-default-400">
              报告生成时间必须比数据收集时间晚至少 5 分钟
            </p>
          </div>
          <div>
            <TimeInput
              value={generateTime}
              onChange={handleGenerateTimeChange}
              color={isGenerateTimeValid ? 'default' : 'warning'}
              errorMessage={
                !isGenerateTimeValid
                  ? '报告生成时间必须比数据收集时间晚至少 5 分钟'
                  : undefined
              }
              isInvalid={!isGenerateTimeValid}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
