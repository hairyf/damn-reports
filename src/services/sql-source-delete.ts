import { db } from '../config/db'

export async function sql_deleteSource(id: string) {
  return db.execute('DELETE FROM Source WHERE id = ?', [id])
}
