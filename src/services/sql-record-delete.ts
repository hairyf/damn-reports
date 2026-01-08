import { db } from '../config/db'

export async function sql_deleteRecord(id: string) {
  return db.deleteFrom('Record').where('id', '=', id).execute()
}
