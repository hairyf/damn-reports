import type { Collector } from '@/utils/exec'
import { getSources } from '@/api/sources'
import { db } from '@/database'
import { executeCollector } from '@/utils/exec'
import * as fs from '@/utils/fs-extra'

const TOOLS_PATH = 'tools.json'

interface ToolRecord {
  id: string
  summary: string
  createdAt: number
  data: Record<string, any>
}

function normalizeToolOutput(output: any): ToolRecord[] {
  if (Array.isArray(output)) {
    return output.filter(Boolean).map((item: any) => ({
      id: String(item?.id ?? crypto.randomUUID()),
      summary: String(item?.summary ?? ''),
      createdAt: typeof item?.createdAt === 'number' ? item.createdAt : Date.now(),
      data: item?.data && typeof item.data === 'object' ? item.data : {},
    }))
  }
  if (output && typeof output === 'object') {
    return [{
      id: String(output.id ?? crypto.randomUUID()),
      summary: String(output.summary ?? ''),
      createdAt: typeof output.createdAt === 'number' ? output.createdAt : Date.now(),
      data: output.data && typeof output.data === 'object' ? output.data : {},
    }]
  }
  return []
}

export async function collectRecords(): Promise<number> {
  const sources = await getSources()
  const tools = await fs.readJson(TOOLS_PATH).catch(() => ({}))

  if (!Array.isArray(sources) || sources.length === 0)
    return 0

  const ws = await db.workspace.findFirst()

  if (!ws)
    throw new Error('Workspace not found')

  const workspaceId = ws.id as number
  const allRecords: Array<{ id: string, summary: string, data: any, createdAt: string, updatedAt: string, source: string, tool: string, workspaceId: number }> = []

  for (const source of sources) {
    const toolDef = tools[source.tool] as Collector | undefined
    if (!toolDef) {
      console.warn(`Tool "${source.tool}" not found in tools.json, skipping source "${source.name}"`)
      continue
    }

    try {
      const output = await executeCollector(toolDef, source.config)
      const records = normalizeToolOutput(output)

      for (const r of records) {
        const tsMs = r.createdAt >= 1e12 ? r.createdAt : r.createdAt * 1000
        const iso = new Date(tsMs).toISOString()
        allRecords.push({
          id: r.id,
          summary: r.summary,
          data: r.data,
          createdAt: iso,
          updatedAt: iso,
          source: source.id,
          tool: source.tool,
          workspaceId,
        })
      }
    }
    catch (err) {
      console.error(`Failed to collect from source "${source.name}" (${source.tool}):`, err)
    }
  }

  if (allRecords.length === 0)
    return 0

  const ids = allRecords.map(r => r.id)
  const existingRows = ids.length > 0
    ? await db.selectFrom('record').select('id').where('id', 'in', ids).execute()
    : []
  const existingIds = new Set(existingRows.map(r => r.id))
  const newRecords = allRecords.filter(r => !existingIds.has(r.id))

  if (newRecords.length > 0) {
    await db.record.createMany(newRecords as any)
  }

  return newRecords.length
}
