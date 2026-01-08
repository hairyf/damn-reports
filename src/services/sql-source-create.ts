import type { Selectable } from 'kysely'
import type { Source } from '../config/db.schema'
import { db } from '../config/db'

export interface SourceCreateInput {
  name: string
  type: string
  description: string
  config: string
}

export async function sql_createSource(input: SourceCreateInput): Promise<Selectable<Source>> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await db
    .insertInto('Source')
    .values({
      id,
      name: input.name,
      type: input.type,
      description: input.description,
      config: input.config,
      createdAt: now,
      updatedAt: now,
    })
    .execute()

  const result = await db
    .selectFrom('Source')
    .selectAll()
    .where('id', '=', id)
    .execute()

  return result[0]
}
