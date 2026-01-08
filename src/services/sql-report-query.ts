import type { Selectable } from 'kysely'
import type { Report } from '../config/db.schema'
import { db } from '../config/db'

export interface ReportSearchInput {
  search?: string
  type?: string
  page?: number
  pageSize?: number
}

export async function sql_queryReports(input: ReportSearchInput): Promise<Selectable<Report>[]> {
  const { search, type, page = 1, pageSize = 10 } = input

  let query = db.selectFrom('Report').selectAll()

  // 如果search不为空，添加搜索条件
  if (search) {
    const searchPattern = `%${search}%`
    query = query.where(eb =>
      eb.or([
        eb('name', 'like', searchPattern),
        eb('content', 'like', searchPattern),
      ]),
    )
  }

  // 如果type不为空，添加类型过滤
  if (type) {
    query = query.where('type', '=', type)
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
