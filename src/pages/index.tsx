import { useQuery } from '@tanstack/react-query'

function Page() {
  const { data: generatedReportsCount = 0 } = useQuery({
    queryKey: [sql_queryReportCount.name],
    queryFn: () => sql_queryReportCount(),
    refetchInterval: 5000,
  })
  const { data: collectedItemsCount = 0 } = useQuery({
    queryKey: [sql_queryRecordCount.name],
    queryFn: () => sql_queryRecordCount(),
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

      {/* 当天报告区域 */}
      <ReportEditor />
    </div>
  )
}

export default Page
