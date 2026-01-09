import type { Selectable } from 'kysely'

export async function sql_querySourceById(id: string): Promise<Selectable<Source> | null> {
  const result = await db
    .selectFrom('Source')
    .selectAll()
    .where('id', '=', id)
    .execute()

  if (!result[0])
    return null
  result[0].enabled = JSON.parse(result[0].enabled as unknown as string)
  result[0].config = JSON.parse(result[0].config as unknown as string)
  return result[0] || null
}
