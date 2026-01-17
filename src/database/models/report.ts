import type { Kysely } from 'kysely'
import dayjs from 'dayjs'
import { Model } from '../model'

export interface ReportFindManyInput {
  search?: string
  type?: string
  page?: number
  pageSize?: number
}

export class Report extends Model<DB, 'report'> {
  constructor(db: Kysely<DB>) {
    super(db, 'report', 'id')
  }

  findMany(input: ReportFindManyInput) {
    const { search, type, page = 1, pageSize = 10 } = input
    let query = this.db.selectFrom('report').selectAll()

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

  async findFirstByType(type: 'daily' | 'weekly' | 'monthly' | 'yearly') {
    // 根据类型计算时间范围
    let startTime: dayjs.Dayjs
    let endTime: dayjs.Dayjs

    switch (type) {
      case 'daily':
        startTime = dayjs().startOf('day')
        endTime = dayjs().endOf('day')
        break
      case 'weekly':
        startTime = dayjs().startOf('week')
        endTime = dayjs().endOf('week')
        break
      case 'monthly':
        startTime = dayjs().startOf('month')
        endTime = dayjs().endOf('month')
        break
      case 'yearly':
        startTime = dayjs().startOf('year')
        endTime = dayjs().endOf('year')
        break
    }

    try {
      // 查询匹配的报告
      const result = await db
        .selectFrom('report')
        .selectAll()
        .where('type', '=', type)
        .where('createdAt', '>=', startTime.toDate() as any)
        .where('createdAt', '<=', endTime.toDate() as any)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .execute()

      return result[0] || null
    }
    catch {
      return null
    }
  }
}
