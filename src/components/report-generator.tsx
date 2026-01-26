import { addToast, Button, Card, CardBody } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useMutation } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import dayjs from 'dayjs'

export interface ReportGeneratorProps {
  generating?: boolean
  onGeneratingChange?: (isGenerating: boolean) => void
}

export function ReportGenerator({ generating, onGeneratingChange }: ReportGeneratorProps) {
  const generateMutation = useMutation({
    mutationFn: async () => {
      await invoke('collect_daily_records')

      const records = await db.record.findMany({
        date: dayjs().startOf('day').toISOString(),
      })

      if (records.length === 0) {
        addToast({ title: '暂无数据', description: '未收集到任何数据' })
        return
      }

      await invoke('generate_daily_report')
      addToast({ title: '报告生成中...', promise: new Promise(() => {}) })
      onGeneratingChange?.(true)
    },
  })

  const isGenerating = generateMutation.isPending || generating

  return (
    <Card className="flex-1 relative" shadow="none">
      <CardBody>
        <ReportCountdown className="absolute top-4 right-4" />
        <h3 className="text-lg font-semibold">
          今日报告
        </h3>
        <div className="flex flex-col items-center justify-center flex-1 gap-4 py-12">
          <div className="flex flex-col items-center justify-center gap-2">
            <Icon icon="line-md:document-report" className="w-18 h-18 text-default-400 dark:text-default-500" />
            <p className="text-default-500 text-center">
              暂无报告，点击按钮进行手动生成
            </p>
          </div>

          <Button
            color="primary"
            onPress={() => generateMutation.mutate()}
            radius="full"
            className="w-30"
            isLoading={isGenerating}
            startContent={!isGenerating
              ? <Icon icon="lucide:sparkles" className="w-4 h-4" />
              : undefined}
          >
            生成
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
