export async function invokeGenerateDaily(): Promise<void> {
  const report = await sql_queryReportType({ type: 'daily' })

  if (report)
    throw new Error('Report already exists')

  await invokeCollectAll()
}
