/* eslint-disable ts/ban-ts-comment */
import type { DeleteResult, Insertable, Kysely, Selectable, Updateable, UpdateResult } from 'kysely'

export class Model<DB, TB extends keyof DB & string, PK extends keyof DB[TB] & string = keyof DB[TB] & string> {
  constructor(protected db: Kysely<DB>, private table: TB, private primaryKey: keyof DB[TB] & string) { }

  create(value: Insertable<DB[TB]>) {
    const sql = this.db.insertInto(this.table)
    if (Object.keys(value).length > 0)
      return sql.values(value).execute()
    return sql.defaultValues().execute()
  }

  createMany(values: Insertable<DB[TB]>[]) {
    return this.db.insertInto(this.table).values(values)
  }

  async delete(id: DB[TB][PK]): Promise<DeleteResult> {
    // @ts-ignore
    const result = await this.db.deleteFrom(this.table).where(this.primaryKey, '=', id).execute()
    return result[0]
  }

  deleteMany(ids: string[]): Promise<DeleteResult[]> {
    // @ts-ignore
    return this.db.deleteFrom(this.table).where(this.primaryKey, 'in', ids).execute()
  }

  update(id: DB[TB][PK], value: Updateable<DB[TB]>): Promise<UpdateResult[]> {
    // @ts-ignore
    return this.db.updateTable(this.table).set(value as any).where(this.primaryKey, '=', id as any).execute()
  }

  updateMany(values: Updateable<DB[TB]>[]) {
    this.db.transaction().execute(async (trx) => {
      Promise.all(values.map(async (value) => {
        return trx.updateTable(this.table)
          // @ts-ignore
          .set(value as any)
          .where(this.primaryKey, '=', (value as any)[this.primaryKey])
          .execute()
      }))
    })
  }

  async count() {
    const count = await this.db.selectFrom(this.table)
      // @ts-ignore
      .select(db.fn.count(this.primaryKey).as('count'))
      .executeTakeFirst()
    return Number(count?.count ?? 0)
  }

  async findUnique(id: DB[TB][PK]): Promise<Selectable<DB[TB]>> {
    const result = await this.db.selectFrom(this.table)
      .selectAll()
      // @ts-ignore
      .where(this.primaryKey, '=', id as any)
      .executeTakeFirst()
    return result[0]
  }
}
