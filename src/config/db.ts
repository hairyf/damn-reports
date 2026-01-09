import type { DB } from './db.schema'
import Database from '@tauri-apps/plugin-sql'
import { Kysely, sql } from 'kysely'
import { TauriSqliteDialect } from 'kysely-dialect-tauri'

export const db = new Kysely<DB>({
  dialect: new TauriSqliteDialect({ database: () => Database.load('sqlite:main.db') }),
})

async function main() {
  // await db.schema.dropTable('Source').execute()
  // await db.schema.dropTable('Report').execute()
  // await db.schema.dropTable('Record').execute()

  if (!(await sql_isExistsTable('Source'))) {
    await db.schema.createTable('Source')
      .addColumn('id', 'text', col => col.primaryKey())
      .addColumn('name', 'text', col => col.notNull())
      .addColumn('type', 'text', col => col.notNull())
      .addColumn('enabled', 'boolean', col => col.notNull().defaultTo(true))
      .addColumn('description', 'text', col => col.notNull())
      .addColumn('config', 'json', col => col.notNull())
      .addColumn('createdAt', 'date', col => col.defaultTo(sql`CURRENT_TIMESTAMP`))
      .addColumn('updatedAt', 'date', col => col.defaultTo(sql`CURRENT_TIMESTAMP`))
      .execute()
  }

  if (!(await sql_isExistsTable('Report'))) {
    await db.schema.createTable('Report')
      .addColumn('id', 'text', col => col.primaryKey())
      .addColumn('name', 'text', col => col.notNull())
      .addColumn('type', 'text', col => col.notNull())
      .addColumn('content', 'text', col => col.notNull())
      .addColumn('createdAt', 'date', col => col.defaultTo(sql`CURRENT_TIMESTAMP`))
      .addColumn('updatedAt', 'date', col => col.defaultTo(sql`CURRENT_TIMESTAMP`))
      .execute()
  }

  if (!(await sql_isExistsTable('Record'))) {
    await db.schema.createTable('Record')
      .addColumn('id', 'text', col => col.primaryKey())
      .addColumn('summary', 'text', col => col.notNull())
      .addColumn('data', 'json', col => col.notNull())
      .addColumn('source', 'text', col => col.notNull())
      .addColumn('createdAt', 'date', col => col.defaultTo(sql`CURRENT_TIMESTAMP`))
      .addColumn('updatedAt', 'date', col => col.defaultTo(sql`CURRENT_TIMESTAMP`))
      .execute()
  }
}

async function insertTestData() {
  const now = new Date().toISOString()

  // 检查是否已有数据，避免重复插入
  const existingSources = await db.selectFrom('Source').select('id').execute()
  const existingReports = await db.selectFrom('Report').select('id').execute()
  const existingRecords = await db.selectFrom('Record').select('id').execute()

  if (existingSources.length === 0) {
    // 插入测试 Source 数据
    await db.insertInto('Source').values([
      {
        id: crypto.randomUUID(),
        name: 'GitHub 仓库',
        type: 'git',
        description: '测试用的 GitHub 数据源',
        config: { url: 'https://github.com/test/repo', branch: 'main' },
        enabled: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        name: 'ClickUp 工作区',
        type: 'clickup',
        description: '测试用的 ClickUp 数据源',
        config: { workspaceId: 'test-workspace', apiKey: 'test-key' },
        enabled: true,
        createdAt: now,
        updatedAt: now,
      },
    ]).execute()
  }

  if (existingReports.length === 0) {
    // 插入测试 Report 数据
    await db.insertInto('Report').values([
      {
        id: crypto.randomUUID(),
        name: '今日工作报告',
        type: 'daily',
        content: '这是测试报告内容',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        name: '本周工作总结',
        type: 'weekly',
        content: '这是测试周报内容',
        createdAt: now,
        updatedAt: now,
      },
    ]).execute()
  }

  if (existingRecords.length === 0) {
    // 获取第一个 Source 的 ID
    const sources = await db.selectFrom('Source').select('id').limit(1).execute()
    const sourceId = sources[0]?.id

    // 只有在存在 Source 数据时才插入 Record 数据
    if (sourceId) {
      await db.insertInto('Record').values([
        {
          id: crypto.randomUUID(),
          summary: '完成了用户登录功能开发',
          data: { type: 'feature', status: 'completed', priority: 'high' },
          source: 'git',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          summary: '修复了数据导出 bug',
          data: { type: 'bugfix', status: 'completed', priority: 'medium' },
          source: 'clickup',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          summary: '优化了页面加载性能',
          data: { type: 'optimization', status: 'in-progress', priority: 'low' },
          source: 'slack',
          createdAt: now,
          updatedAt: now,
        },
      ]).execute()
    }
  }
}

main().then(() => {
  insertTestData()
})
