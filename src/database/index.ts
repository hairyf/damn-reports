import type { DB } from './types'
import { invoke } from '@tauri-apps/api/core'
import Database from '@tauri-apps/plugin-sql'
import { Kysely } from 'kysely'
import { TauriSqliteDialect } from 'kysely-dialect-tauri'
import * as models from './models'

const promise = Database.load('sqlite:main.db')

promise.then(() => invoke('database_loaded'))

const connection = new Kysely<DB>({
  dialect: new TauriSqliteDialect({ database: () => promise }),
})

export const db = Object.assign(connection, {
  record: new models.Record(connection),
  report: new models.Report(connection),
  source: new models.Source(connection),
  workspace: new models.Workspace(connection),
})
