import { db } from '../config/db'

export async function sql_isExistsTable(tableName: string) {
  const result = await db
    .selectFrom('sqlite_master')
    .select('name')
    .where('type', '=', 'table')
    .where('name', '=', tableName)
    .execute()
  return result.length > 0
}
