import { Card, CardBody, CardHeader, Input } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useStore } from 'valtio-define'

export function SettingReportCard() {
  const setting = useStore(store.setting)

  return (
    <Card shadow="none">
      <CardHeader className="flex gap-3 items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Icon icon="lucide:file-text" className="w-5 h-5" />
          <p className="text-md font-semibold">日报设置</p>
        </div>
      </CardHeader>
      <CardBody className="gap-6 pt-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:clock" className="w-4 h-4 text-default-500" />
            <label className="text-sm font-medium">定时生成</label>
          </div>
          <Input
            type="time"
            value={setting.dailyReportTime}
            onChange={e => store.setting.dailyReportTime = e.target.value}
          />
          <p className="text-xs text-default-400">
            每天将在该时间自动生成日报
          </p>
        </div>
      </CardBody>
    </Card>
  )
}
