import type { Selectable } from 'kysely'
import type { Report } from '../config/db.schema'
import { db } from '../config/db'

export async function sql_queryReportById(id: string): Promise<Selectable<Report> | null> {
  const result = await db
    .selectFrom('Report')
    .selectAll()
    .where('id', '=', id)
    .execute()

  return result[0] || null
}
