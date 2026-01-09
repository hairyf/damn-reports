import type { Selectable } from 'kysely'
import type { Source } from '@/config/db.schema'

export async function invokeCollectAll(): Promise<void> {
  const sources = await sql_querySources({ enabled: true, page: 1, pageSize: 100 }) as Selectable<Source>[]

  const promises = sources.map(async (source) => {
    const defaultData = {
      source: source.type,
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
  await db.insertInto('Record').values(records).execute()
}
