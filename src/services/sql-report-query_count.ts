export interface ReportSearchInput {
  search?: string
  type?: string
}

export async function sql_queryReportCount(input: ReportSearchInput = {}): Promise<number> {
  try {
    const { search, type } = input

    let query = db.selectFrom('Report').select(db.fn.count('id').as('count'))

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

    const result = await query.executeTakeFirst()
    return Number(result?.count ?? 0)
  }
  catch (error) {
    console.error(error)
    return 0
  }
}
