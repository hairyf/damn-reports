import { db } from '../config/db'

export async function sql_deleteReport(id: string) {
  return db.deleteFrom('Report').where('id', '=', id).execute()
}
