import { addToast, Button, Card, CardBody } from '@heroui/react'
import { Icon } from '@iconify/react'
import { invoke } from '@tauri-apps/api/core'
import dayjs from 'dayjs'

export interface ReportGeneratorProps {
  generating?: boolean
  onGeneratingChange?: (isGenerating: boolean) => void
}

export function ReportGenerator({ generating, onGeneratingChange }: ReportGeneratorProps) {
  async function onGenerate() {
    await invoke('collect_daily_records')

    const records = await db.record.findMany({
      date: dayjs().startOf('day').toISOString(),
    })

    if (records.length === 0) {
      addToast({ title: '暂无数据', description: '未收集到任何数据' })
      return
    }

    await invoke('generate_daily_report')
    addToast({ title: '报告生成中...' })
    onGeneratingChange?.(true)
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
            isLoading={generating}
            startContent={!generating ? <Icon icon="lucide:sparkles" className="w-4 h-4" /> : undefined}
          >
            生成
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
