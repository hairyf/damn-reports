import { db } from '../config/db'

export async function sql_deleteReport(id: string) {
  return db.execute('DELETE FROM Report WHERE id = ?', [id])
}
