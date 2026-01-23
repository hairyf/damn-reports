import type { Kysely } from 'kysely'
import { Model } from '../model'

export interface RecordFindManyInput {
  search?: string
  source?: string
  workspace?: number
  date?: string
}

export interface RecordInJoined {
  id: string
  summary: string
  data: any
  createdAt: number
  updatedAt: number
  sourceId: number
  workspaceId: number
  sourceName: string
  source: string
}

export interface RecordFindManyPageInput extends RecordFindManyInput {
  page?: number
  pageSize?: number
}

export interface RecordFindManyPageOutput {
  data: RecordInJoined[]
  total: number
}

export class Record extends Model<DB, 'record'> {
  constructor(db: Kysely<DB>) {
    super(db, 'record', 'id')
  }

  async findManyPage(input: RecordFindManyPageInput): Promise<RecordFindManyPageOutput> {
    const { page = 1, pageSize = 20, ...queryInput } = input

    // 构建基础查询（用于获取总数和分页数据）
    const baseQuery = this.findManyQuery(queryInput)

    // 计算总数：使用相同的查询条件，但只计算数量
    const countQuery = baseQuery
      .clearSelect()
      .select(this.db.fn.count('record.id').as('count'))

    // 应用分页
    const offset = page > 0 ? (page - 1) * pageSize : 0
    const dataQuery = baseQuery
      .limit(pageSize)
      .offset(offset)

    // 执行查询获取数据
    const [total, data] = await Promise.all([
      countQuery.executeTakeFirst().then(rs => Number(rs?.count ?? 0)),
      dataQuery.execute(),
    ])

    return { data, total }
  }

  findManyQuery(input: RecordFindManyInput) {
    const { search, source, workspace, date } = input

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
      // date 是当天的开始时间（ISO 字符串），需要转换为时间戳（秒）进行比较
      // 即 createdAt >= date && createdAt < date + 1 day
      const startDate = Math.floor(new Date(date).getTime() / 1000) // 转换为秒级时间戳
      const endDate = Math.floor((new Date(date).getTime() + 24 * 60 * 60 * 1000) / 1000) // 转换为秒级时间戳
      query = query
        .where('record.createdAt', '>=', startDate)
        .where('record.createdAt', '<', endDate)
    }

    query = query.orderBy('record.createdAt', 'desc')

    return query
  }

  findMany(input: RecordFindManyInput) {
    const query = this.findManyQuery(input)
    return query.execute()
  }
}
