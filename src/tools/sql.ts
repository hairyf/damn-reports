/* eslint-disable no-console */
import { tool } from 'ai'
import { sql } from 'kysely'
import { z } from 'zod'
import { db } from '@/database'

export const exec_sql = tool({
  description: [
    '在应用内置 SQLite 数据库（main.db）上执行 SQL。数据库已由应用自动管理，无需创建或查找数据库文件。',
    '',
    'Schema:',
    '  record(id TEXT, summary TEXT, data TEXT, createdAt TEXT, updatedAt TEXT, source TEXT, tool TEXT)',
    '  report(id INTEGER PK AUTO, name TEXT, type TEXT, content TEXT, createdAt TEXT, updatedAt TEXT)',
    '',
    '常见用法: SELECT * FROM record ORDER BY createdAt DESC LIMIT 10',
  ].join('\n'),
  inputSchema: z.object({
    sql: z.string().describe('要执行的 SQL 语句（SELECT/INSERT/UPDATE/DELETE）'),
  }),
  execute: async ({ sql: sqlString }) => {
    try {
      const result = await sql`${sql.raw(sqlString)}`.execute(db)
      return JSON.parse(JSON.stringify(result, (_key, value) =>
        typeof value === 'bigint' ? Number(value) : value))
    }
    catch (error) {
      console.log(error)
      throw error
    }
  },
})
