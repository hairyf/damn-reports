import type { DB } from './types'
import Database from '@tauri-apps/plugin-sql'
import { Kysely } from 'kysely'
import { TauriSqliteDialect } from 'kysely-dialect-tauri'

const connection = new Kysely<DB>({
  dialect: new TauriSqliteDialect({ database: () => Database.load('sqlite:main.db') }),
})

export const db = Object.assign(connection, {

})
