function Page() {
  // 统计数据
  const generatedReportsCount = 10

  return (
    <div className="flex flex-col gap-6 flex-1">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 已生成报告卡片 */}
        <TrendCard title="已生成报告" value={`${generatedReportsCount} 条`} />

        {/* 收集的数据项卡片 */}
        <TrendCard title="收集的数据项" value="100k" />
      </div>

      {/* 当天报告区域 */}
      <ReportEditor />
    </div>
  )
}

export default Page
