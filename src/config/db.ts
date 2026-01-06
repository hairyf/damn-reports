import { proxy } from '@hairy/utils'
import Database from '@tauri-apps/plugin-sql'

export const db = proxy<Database>()
export const db_promise = Database.load('sqlite:main.db').then(_db => db.proxy.update(_db))
