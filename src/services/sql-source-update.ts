import type { Selectable } from 'kysely'

export interface SourceUpdateInput {
  id: string
  name?: string
  type?: string
  enabled?: boolean
  description?: string
  config?: Record<string, any>
}

export async function sql_updateSource(input: SourceUpdateInput): Promise<Selectable<Source>> {
  const now = new Date().toISOString()

  const updateValues: {
    name?: string
    type?: string
    enabled?: boolean
    description?: string
    config?: Record<string, any>
    updatedAt?: string
  } = {}
  if (input.name !== undefined)
    updateValues.name = input.name
  if (input.type !== undefined)
    updateValues.type = input.type
  if (input.enabled !== undefined)
    updateValues.enabled = input.enabled
  if (input.description !== undefined)
    updateValues.description = input.description
  if (input.config !== undefined)
    updateValues.config = input.config

  if (Object.keys(updateValues).length === 0)
    return (await sql_querySourceById(input.id))!

  // 添加 updatedAt
  updateValues.updatedAt = now

  await db
    .updateTable('Source')
    .set(updateValues)
    .where('id', '=', input.id)
    .execute()

  return (await sql_querySourceById(input.id))!
}
