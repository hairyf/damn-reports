import type { Report } from '../config/db.schema'
import { db } from '../config/db'

export async function sql_queryReportById(id: string): Promise<Report | null> {
  const result = await db.select<Report[]>(
    'SELECT * FROM Report WHERE id = ?',
    [id],
  )

  return result[0] || null
}
