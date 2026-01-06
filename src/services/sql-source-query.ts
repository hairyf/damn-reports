import type { Source } from '../config/db.schema'
import { db } from '../config/db'

export interface SourceQueryInput {
  search?: string
  type?: string
  page?: number
  pageSize?: number
}

export async function sql_querySources(input: SourceQueryInput = {}): Promise<Source[]> {
  const { search, type, page = 1, pageSize = 10 } = input

  const conditions: string[] = []
  const params: any[] = []

  // 如果search不为空，添加搜索条件
  if (search) {
    conditions.push('(name LIKE ? OR config LIKE ?)')
    const searchPattern = `%${search}%`
    params.push(searchPattern, searchPattern)
  }

  // 如果type不为空，添加类型过滤
  if (type) {
    conditions.push('type = ?')
    params.push(type)
  }

  // 构建WHERE子句
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // 构建分页
  let limitClause = ''
  if (pageSize) {
    const offset = page && page > 0 ? (page - 1) * pageSize : 0
    limitClause = `LIMIT ${pageSize} OFFSET ${offset}`
  }

  // 构建完整查询
  const query = `
    SELECT * FROM Source
    ${whereClause}
    ORDER BY createdAt DESC
    ${limitClause}
  `.trim()

  return db.select<Source[]>(query, params)
}
