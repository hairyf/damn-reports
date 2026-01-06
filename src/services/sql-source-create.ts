import type { Source, SourceCreateInput } from '../config/db.schema'
import { db } from '../config/db'

export async function sql_createSource(input: SourceCreateInput): Promise<Source> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await db.execute(
    'INSERT INTO Source (id, name, type, config, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [id, input.name, input.type, input.config, now, now],
  )

  const result = await db.select<Source[]>(
    'SELECT * FROM Source WHERE id = ?',
    [id],
  )

  return result[0]
}
