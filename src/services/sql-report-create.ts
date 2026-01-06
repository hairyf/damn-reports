import type { Report, ReportCreateInput } from '../config/db.schema'
import { db } from '../config/db'

export async function sql_createReport(input: ReportCreateInput): Promise<Report> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await db.execute(
    'INSERT INTO Report (id, name, sourceId, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [id, input.name, input.sourceId, input.content, now, now],
  )

  const result = await db.select<Report[]>(
    'SELECT * FROM Report WHERE id = ?',
    [id],
  )

  return result[0]
}
