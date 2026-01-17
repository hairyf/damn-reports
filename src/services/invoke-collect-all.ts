import type { Selectable } from 'kysely'
import type { Source } from '@/database/types'

export async function invokeCollectAll(): Promise<void> {
  const sources = await sql_querySources({ enabled: true, page: 1, pageSize: 100 }) as Selectable<Source>[]

  const promises = sources.map(async (source) => {
    const defaultData = {
      sourceId: source.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    if (source.type === 'git') {
      const data = await invokeCollectGit(source.config).then(({ data }) => data)
      return data.map(item => ({
        id: item.id,
        summary: item.message,
        data: item,
        ...defaultData,
      }))
    }
    const data = await invokeCollectClickup(source.config).then(({ data }) => data)
    return data.map(item => ({
      id: item.id,
      summary: item.name,
      data: item,
      ...defaultData,
    }))
  })

  const records = await Promise.all(promises).then(results => results.flat())

  // 查询数据库中已存在的记录 ID
  const existingIds = await db
    .selectFrom('record')
    .select('id')
    .where('id', 'in', records.map(r => r.id))
    .execute()
    .then(results => new Set(results.map(r => r.id)))

  // 过滤掉已存在的记录，只插入新记录
  const uniqueRecords = records.filter(record => !existingIds.has(record.id))

  if (uniqueRecords.length > 0) {
    await db.insertInto('record').values(uniqueRecords).execute()
  }
}
