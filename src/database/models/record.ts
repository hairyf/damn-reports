import type { Kysely } from 'kysely'
import dayjs from 'dayjs'
import { Model } from 'kysely-model'

export interface RecordFindManyInput {
  search?: string
  source?: string
  sourceIds?: string[]
  date?: string
}

export interface RecordRow {
  id: string
  summary: string
  data: any
  createdAt: string | number
  updatedAt: string | number
  source: string
  tool: string
}

export interface RecordInJoined extends RecordRow {
  sourceName: string
}

export interface RecordFindManyPageInput extends RecordFindManyInput {
  page?: number
  pageSize?: number
}

export interface RecordFindManyPageOutput {
  data: RecordInJoined[]
  total: number
}

export interface RecordFindManyPageRawOutput {
  data: RecordRow[]
  total: number
}

export class Record extends Model<DB, 'record'> {
  constructor(db: Kysely<DB>) {
    super(db, 'record', 'id')
  }

  async findManyPage(input: RecordFindManyPageInput): Promise<RecordFindManyPageRawOutput> {
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
    const { search, source, sourceIds, date } = input

    let query = this.db
      .selectFrom('record')
      .selectAll('record')

    if (search) {
      const searchPattern = `%${search}%`
      query = query.where(eb =>
        eb.or([
          eb('record.summary', 'like', searchPattern),
        ]),
      )
    }

    if (source) {
      query = query.where('record.tool', '=', source)
    }
    else if (sourceIds && sourceIds.length > 0) {
      query = query.where('record.source', 'in', sourceIds)
    }

    if (date) {
      const startStr = dayjs(date).startOf('day').toISOString()
      const endStr = dayjs(date).endOf('day').toISOString()
      query = query
        .where('record.updatedAt', '>=', startStr)
        .where('record.updatedAt', '<', endStr)
    }

    query = query.orderBy('record.updatedAt', 'desc')

    return query
  }

  /** Fetch records and merge with source info from source.json. Use findManyPageWithSources for UI. */
  async findManyPageWithSources(
    input: RecordFindManyPageInput,
    sourceMap: Map<string, { name: string, tool: string }>,
  ): Promise<RecordFindManyPageOutput> {
    const result = await this.findManyPage({
      ...input,
    })

    const data: RecordInJoined[] = result.data.map((row: RecordRow) => {
      const src = sourceMap.get(row.source)
      return {
        ...row,
        sourceName: src?.name ?? row.source,
      }
    })

    return { data, total: result.total }
  }

  findMany(input: RecordFindManyInput) {
    const query = this.findManyQuery(input)
    return query.execute()
  }
}
