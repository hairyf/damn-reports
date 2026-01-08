import type { Selectable } from 'kysely'
import type { Record } from '../config/db.schema'
import { db } from '../config/db'

export async function sql_queryRecordById(id: string): Promise<Selectable<Record> | null> {
  const result = await db
    .selectFrom('Record')
    .selectAll()
    .where('id', '=', id)
    .execute()

  return result[0] || null
}
