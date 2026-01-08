import type { Selectable } from 'kysely'
import type { Record } from '../config/db.schema'
import { db } from '../config/db'

export interface RecordQueryInput {
  search?: string
  source?: string
  page?: number
  pageSize?: number
}

export async function sql_queryRecords(input: RecordQueryInput = {}): Promise<Selectable<Record>[]> {
  const { search, source, page = 1, pageSize = 10 } = input

  let query = db.selectFrom('Record').selectAll()

  // 如果search不为空，添加搜索条件
  if (search) {
    const searchPattern = `%${search}%`
    query = query.where(eb =>
      eb.or([
        eb('summary', 'like', searchPattern),
        eb('data', 'like', searchPattern),
      ]),
    )
  }

  // 如果source不为空，添加来源过滤
  if (source) {
    query = query.where('source', '=', source)
  }

  // 排序
  query = query.orderBy('createdAt', 'desc')

  // 分页
  if (pageSize) {
    const offset = page && page > 0 ? (page - 1) * pageSize : 0
    query = query.limit(pageSize).offset(offset)
  }

  return query.execute()
}
