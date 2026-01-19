import { addToast, Button, Card, CardBody } from '@heroui/react'
import { Icon } from '@iconify/react'
import { invoke } from '@tauri-apps/api/core'

export function ReportGenerator() {
  async function onGenerate() {
    await invoke('generate_daily_report')

    const count = await invoke<number>('collect_daily_records')

    if (count === 0)
      return addToast({ title: '没有收集到今天的数据' })

    await invoke('generate_daily_report')
  }
  return (
    <Card className="flex-1">
      <CardBody>
        <h3 className="text-lg font-semibold">
          今日报告
        </h3>
        <div className="flex flex-col items-center justify-center flex-1 gap-4 py-12">
          <div className="flex flex-col items-center justify-center gap-2">
            <Icon icon="lucide:file-text" className="w-18 h-18 text-default-400" />
            <p className="text-default-500 text-center">
              暂无数据，点击按钮进行生成
            </p>
          </div>
          <Button
            color="primary"
            onPress={onGenerate}
            radius="full"
            className="w-30"
            startContent={<Icon icon="lucide:sparkles" className="w-4 h-4" />}
          >
            生成
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
