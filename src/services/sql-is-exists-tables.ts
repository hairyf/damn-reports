export async function sql_isExistsTable(tableName: string) {
  const result = await db.select<{ name: string }[]>(
    'SELECT name FROM sqlite_master WHERE type=\'table\' AND name = ?',
    [tableName],
  )
  return result.length > 0
}
