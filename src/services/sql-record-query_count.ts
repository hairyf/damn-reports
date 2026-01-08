export interface RecordQueryInput {
  search?: string
  source?: string
}

export async function sql_queryRecordCount(input: RecordQueryInput = {}): Promise<number> {
  try {
    const { search, source } = input

    let query = db.selectFrom('Record').select(db.fn.count('id').as('count'))

    // 如果search不为空，添加搜索条件
    if (search) {
      const searchPattern = `%${search}%`
      query = query.where(eb =>
        eb.or([
          eb('summary', 'like', searchPattern),
          eb('data', 'like', searchPattern),
        ]),
      )
    }

    // 如果source不为空，添加来源过滤
    if (source) {
      query = query.where('source', '=', source)
    }

    const result = await query.executeTakeFirst()
    return Number(result?.count ?? 0)
  }
  catch (error) {
    console.error(error)
    return 0
  }
}
