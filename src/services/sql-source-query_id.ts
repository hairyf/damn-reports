import type { Source } from '../config/db.schema'
import { db } from '../config/db'

export async function sql_querySourceById(id: string): Promise<Source | null> {
  const result = await db.select<Source[]>(
    'SELECT * FROM Source WHERE id = ?',
    [id],
  )

  return result[0] || null
}
