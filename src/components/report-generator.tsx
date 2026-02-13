import { Button, Card, CardBody } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useMutation } from '@tanstack/react-query'
import { useStore } from 'valtio-define'
import { store } from '@/store'

export function ReportGenerator() {
  const { loading } = useStore(store.report)
  const generateMutation = useMutation({
    mutationFn: () => store.report.generateDailyReport(),
  })

  const isGenerating = generateMutation.isPending || loading

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
