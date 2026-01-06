import type { Report } from '../config/db.schema'
import { db } from '../config/db'

export interface ReportSearchInput {
  search?: string
  type?: string
  page?: number
  pageSize?: number
}

export async function sql_queryReports(input: ReportSearchInput): Promise<Report[]> {
  const { search, type, page = 1, pageSize = 10 } = input

  const conditions: string[] = []
  const params: any[] = []

  // 如果search不为空，添加搜索条件
  if (search) {
    conditions.push('(r.name LIKE ? OR r.content LIKE ?)')
    const searchPattern = `%${search}%`
    params.push(searchPattern, searchPattern)
  }

  // 如果type不为空，需要JOIN Source表并添加类型过滤
  const needsJoin = !!type
  if (type) {
    conditions.push('s.type = ?')
    params.push(type)
  }

  // 构建WHERE子句
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // 构建JOIN子句
  const joinClause = needsJoin ? 'INNER JOIN Source s ON r.sourceId = s.id' : ''

  // 构建分页
  let limitClause = ''
  if (pageSize) {
    const offset = page && page > 0 ? (page - 1) * pageSize : 0
    limitClause = `LIMIT ${pageSize} OFFSET ${offset}`
  }

  // 构建完整查询
  const query = `
    SELECT r.id, r.name, r.sourceId, r.content, r.createdAt, r.updatedAt
    FROM Report r
    ${joinClause}
    ${whereClause}
    ORDER BY r.createdAt DESC
    ${limitClause}
  `.trim()

  return db.select<Report[]>(query, params)
}
