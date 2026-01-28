import { Else, If, Then } from '@hairy/react-lib'
import { closeAll } from '@heroui/react'
import { useQuery } from '@tanstack/react-query'
import { listen } from '@tauri-apps/api/event'
import { useLocalStorage } from 'react-use'

function Page() {
  const [generating, setGenerating] = useLocalStorage('report_generating', false)
  const { data: generatedReportsCount = 0 } = useQuery({
    queryKey: ['reports'],
    queryFn: () => db.report.count(),
    refetchInterval: 5000,
  })

  const { data: collectedItemsCount = 0 } = useQuery({
    queryKey: ['records'],
    queryFn: () => db.record.count(),
    refetchInterval: 5000,
  })

  const { data: detail, refetch } = useQuery({
    queryKey: ['reports', 'daily'],
    queryFn: async () => {
      const result = await db.report.findFirstByType({ type: 'daily' })
      if (result) {
        setGenerating(false)
        closeAll()
      }
      return result ?? null
    },
    refetchInterval: 5000,
  })

  return (
    <div className="flex flex-col gap-6 flex-1">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 已生成报告卡片 */}
        <TrendCard title="已生成报告" value={`${generatedReportsCount} 个`} />

        {/* 收集的数据项卡片 */}
        <TrendCard title="收集的数据项" value={`${collectedItemsCount} 项`} />
      </div>

      <If cond={detail}>
        <Then>
          <ReportEditor
            reportId={detail?.id ?? 0}
            showCancel={false}
            onDeleted={refetch}
          />
        </Then>
        <Else>
          <ReportGenerator
            generating={generating}
            onGeneratingChange={setGenerating}
          />
        </Else>
      </If>
    </div>
  )
}

listen('report_generated', () => {
  queryClient.invalidateQueries({ queryKey: ['reports'] })
  queryClient.invalidateQueries({ queryKey: ['records'] })
})

export default Page
