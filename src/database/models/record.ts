import type { Kysely } from 'kysely'
import { Model } from '../model'

export interface RecordFindManyInput {
  search?: string
  source?: string
  workspace?: number
  page?: number
  pageSize?: number
  date?: string
}

export class Record extends Model<DB, 'record'> {
  constructor(db: Kysely<DB>) {
    super(db, 'record', 'id')
  }

  findMany(input: RecordFindManyInput) {
    const { search, source, workspace, page = 1, pageSize = 10, date } = input

    let query = this.db
      .selectFrom('record') // 从 record 表开始查询
      .innerJoin('source', 'source.id', 'record.sourceId') // 关联 source 表，条件是 id 匹配
      .innerJoin('workspace', 'workspace.id', 'record.workspaceId') // 关联 workspace 表，条件是 id 匹配
      .selectAll('record') // 选中 record 表的所有字段
      .select([
        'source.name as sourceName', // 也可以顺便选出 source 的一些字段
        'source.type as source',
      ])

    // 如果search不为空，添加搜索条件
    if (search) {
      const searchPattern = `%${search}%`
      query = query.where(eb =>
        eb.or([
          eb('summary', 'like', searchPattern),
        ]),
      )
    }

    // 如果 source 不为空，添加来源过滤
    if (source) {
      query = query.where('source.type', '=', 'git')
    }

    // 如果 workspace 不为空，添加 workspace 过滤
    if (typeof workspace === 'number') {
      query = query.where('workspace.id', '=', workspace)
    }

    if (date) {
      query = query.where('record.createdAt', '>=', date)
    }

    query = query.orderBy('record.createdAt', 'desc')

    // 分页
    if (pageSize) {
      const offset = page && page > 0 ? (page - 1) * pageSize : 0
      query = query.limit(pageSize).offset(offset)
    }

    return query.execute()
  }
}
