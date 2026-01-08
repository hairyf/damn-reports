import { db } from '../config/db'

export async function sql_deleteSource(id: string) {
  return db.deleteFrom('Source').where('id', '=', id).execute()
}
