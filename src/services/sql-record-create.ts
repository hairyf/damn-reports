import type { Selectable } from 'kysely'
import type { Record } from '../config/db.schema'
import { db } from '../config/db'

export interface RecordCreateInput {
  summary: string
  source: string
  data: string
}

export async function sql_createRecord(input: RecordCreateInput): Promise<Selectable<Record>> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await db
    .insertInto('Record')
    .values({
      id,
      summary: input.summary,
      source: input.source,
      data: input.data,
      createdAt: now,
      updatedAt: now,
    })
    .execute()

  const result = await db
    .selectFrom('Record')
    .selectAll()
    .where('id', '=', id)
    .execute()

  return result[0]
}
