import type { Kysely } from 'kysely'
import dayjs from 'dayjs'
import { Model } from '../model'

export interface ReportFindManyInput {
  workspace?: number
  search?: string
  type?: string
  page?: number
  pageSize?: number
}

export interface ReportFindByTypeInput {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  workspace?: number
}

export class Report extends Model<DB, 'report'> {
  constructor(db: Kysely<DB>) {
    super(db, 'report', 'id')
  }

  findMany(input: ReportFindManyInput) {
    const { search, type, workspace, page = 1, pageSize = 10 } = input
    let query = this.db.selectFrom('report')
      .selectAll()
      .innerJoin('workspace', 'workspace.id', 'report.workspaceId') // 关联 workspace 表，条件是 id 匹配

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

    if (typeof workspace === 'number') {
      query = query.where('workspace.id', '=', workspace)
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

  async findFirstByType(input: ReportFindByTypeInput) {
    const { type, workspace } = input
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
      let query = db
        .selectFrom('report')
        .selectAll()
        .where('type', '=', type)

      if (typeof workspace === 'number') {
        query = query.where('workspaceId', '=', workspace)
      }

      query = query.where('createdAt', '>=', startTime.toDate() as any)
        .where('createdAt', '<=', endTime.toDate() as any)
        .orderBy('createdAt', 'desc')
        .limit(1)

      const result = await query.executeTakeFirst()
      return result ?? null
    }
    catch {
      return null
    }
  }
}
