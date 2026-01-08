import type { Selectable } from 'kysely'
import type { Record } from '../config/db.schema'
import { db } from '../config/db'

export interface RecordUpdateInput {
  id: string
  summary?: string
  source?: string
  data?: string
}

export async function sql_updateRecord(input: RecordUpdateInput): Promise<Selectable<Record>> {
  const now = new Date().toISOString()

  const updateValues: {
    summary?: string
    source?: string
    data?: string
    updatedAt?: string
  } = {}
  if (input.summary !== undefined) {
    updateValues.summary = input.summary
  }
  if (input.source !== undefined) {
    updateValues.source = input.source
  }
  if (input.data !== undefined) {
    updateValues.data = input.data
  }

  if (Object.keys(updateValues).length === 0) {
    // 如果没有要更新的字段，直接返回现有记录
    const result = await db
      .selectFrom('Record')
      .selectAll()
      .where('id', '=', input.id)
      .execute()
    return result[0]
  }

  // 添加 updatedAt
  updateValues.updatedAt = now

  await db
    .updateTable('Record')
    .set(updateValues)
    .where('id', '=', input.id)
    .execute()

  const result = await db
    .selectFrom('Record')
    .selectAll()
    .where('id', '=', input.id)
    .execute()

  return result[0]
}
