import type { DB } from './types'
import { invoke } from '@tauri-apps/api/core'
import Database from '@tauri-apps/plugin-sql'
import { Kysely } from 'kysely'
import { TauriSqliteDialect } from 'kysely-dialect-tauri'
import * as models from './models'

const promise = Database.load('sqlite:main.db')

promise.then(() => {
  // 延迟执行 IPC 调用，确保 Tauri 后端已完全初始化
  setTimeout(() => {
    invoke('database_loaded').catch((err) => {
      // 静默处理初始调用失败，应用启动时后端可能还未完全就绪
      console.debug('Database loaded notification failed (expected during app startup):', err)
    })
  }, 100)
})

const connection = new Kysely<DB>({
  dialect: new TauriSqliteDialect({ database: () => promise }),
})

export const db = Object.assign(connection, {
  record: new models.Record(connection),
  report: new models.Report(connection),
  source: new models.Source(connection),
  workspace: new models.Workspace(connection),
})
