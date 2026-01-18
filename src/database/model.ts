/* eslint-disable ts/ban-ts-comment */
import type { DeleteResult, Insertable, InsertResult, Kysely, Selectable, Updateable, UpdateResult } from 'kysely'

export class Model<DB, TB extends keyof DB & string, PK extends keyof DB[TB] & string = keyof DB[TB] & string> {
  constructor(protected db: Kysely<DB>, private table: TB, private primaryKey: keyof DB[TB] & string) { }

  create(value: Insertable<DB[TB]>): Promise<InsertResult> {
    const sql = this.db.insertInto(this.table)
    if (Object.keys(value).length > 0)
      return sql.values(value).execute().then(result => result[0])
    return sql.defaultValues().execute().then(result => result[0])
  }

  createMany(values: Insertable<DB[TB]>[]) {
    return this.db.insertInto(this.table).values(values).execute()
  }

  delete(id: DB[TB][PK]): Promise<DeleteResult> {
    return this.db
      .deleteFrom(this.table)
      // @ts-ignore
      .where(this.primaryKey, '=', id)
      .execute()
      // @ts-ignore
      .then(result => result[0])
  }

  deleteMany(ids: string[]): Promise<DeleteResult[]> {
    return this.db
      .deleteFrom(this.table)
      // @ts-ignore
      .where(this.primaryKey, 'in', ids)
      .execute()
  }

  update(id: DB[TB][PK], value: Updateable<DB[TB]>): Promise<UpdateResult[]> {
    return this.db
      .updateTable(this.table)
      // @ts-ignore
      .set(value as any)
      .where(this.primaryKey, '=', id as any)
      .execute()
  }

  updateMany(values: Updateable<DB[TB]>[]) {
    return this.db
      .transaction()
      .execute(async (trx) => {
        Promise.all(values.map(async value =>
          trx.updateTable(this.table)
            // @ts-ignore
            .set(value as any)
            .where(this.primaryKey, '=', (value as any)[this.primaryKey])
            .execute()),
        )
      })
  }

  count() {
    return this.db
      .selectFrom(this.table)
      // @ts-ignore
      .select(db.fn.count(this.primaryKey).as('count'))
      .executeTakeFirst()
      // @ts-ignore
      .then(result => result?.count ?? 0)
  }

  findUnique(id: DB[TB][PK]): Promise<Selectable<DB[TB]>> {
    return this.db
      .selectFrom(this.table)
      .selectAll()
      // @ts-ignore
      .where(this.primaryKey, '=', id as any)
      .executeTakeFirst()
  }

  findMany(..._placeholder: any[]) {
    return this.db
      .selectFrom(this.table)
      .selectAll()
      .execute()
  }
}
