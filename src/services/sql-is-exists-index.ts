import { db } from '../config/db'

export async function sql_isExistsIndex(indexName: string) {
  const result = await db
    .selectFrom('sqlite_master')
    .select('name')
    .where('type', '=', 'index')
    .where('name', '=', indexName)
    .execute()
  return result.length > 0
}
