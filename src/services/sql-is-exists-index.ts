export async function sql_isExistsIndex(indexName: string) {
  const result = await db.select<{ name: string }[]>(
    'SELECT name FROM sqlite_master WHERE type=\'index\' AND name = ?',
    [indexName],
  )
  return result.length > 0
}
