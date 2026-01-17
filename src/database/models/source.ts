import type { Kysely } from 'kysely'
import { Model } from '../model'

export interface SourceFindManyInput {
  enabled?: boolean
  search?: string
  type?: string
  page?: number
  pageSize?: number
}

export class Source extends Model<DB, 'source'> {
  constructor(db: Kysely<DB>) {
    super(db, 'source', 'id')
  }

  async findMany(input: SourceFindManyInput) {
    const { search, type, enabled, page = 1, pageSize = 10 } = input

    let query = db.selectFrom('source').selectAll()

    // 如果search不为空，添加搜索条件
    if (search) {
      const searchPattern = `%${search}%`
      query = query.where(eb =>
        eb.or([
          eb('name', 'like', searchPattern),
          eb('description', 'like', searchPattern),
        ]),
      )
    }

    // 如果type不为空，添加类型过滤
    if (type) {
      query = query.where('type', '=', type)
    }

    // 如果enabled不为空，添加enabled过滤
    if (enabled !== undefined) {
      query = query.where('enabled', '=', enabled)
    }

    // 排序
    query = query.orderBy('createdAt', 'desc')

    // 分页
    if (pageSize) {
      const offset = page && page > 0 ? (page - 1) * pageSize : 0
      query = query.limit(pageSize).offset(offset)
    }

    const result = await query.execute()
    for (const item of result) {
      item.enabled = JSON.parse(item.enabled as any)
      item.config = JSON.parse(item.config as any)
    }
    return result
  }
}
