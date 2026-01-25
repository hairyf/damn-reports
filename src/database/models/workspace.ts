import type { Kysely } from 'kysely'
import { Model } from '../model'

export class Workspace extends Model<DB, 'workspace'> {
  constructor(db: Kysely<DB>) {
    super(db, 'workspace', 'id')
  }

  // 获取或创建工作区占位符，用于在初始化工作流时创建工作区
  async getOrCreatePlaceHolder() {
    const existing = await db
      .selectFrom('workspace')
      .selectAll()
      .where('workflow', '=', '__workflow__')
      .executeTakeFirst()

    if (existing) {
      // 如果已存在，返回现有记录的 id
      return existing.id.toString()
    }

    // 如果不存在，创建新记录
    const { insertId } = await db.workspace.create({
      name: 'Default Report Workflow',
      workflow: '__workflow__',
    })
    return insertId!.toString()
  }
}
