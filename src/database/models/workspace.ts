import type { Kysely } from 'kysely'
import { Model } from '../model'

export class Workspace extends Model<DB, 'workspace'> {
  constructor(db: Kysely<DB>) {
    super(db, 'workspace', 'id')
  }
}
