import dayjs from 'dayjs'
import { getSources } from '@/api/sources'
import { db } from '@/database'

export type RecordType = 'daily' | 'weekly' | 'monthly' | 'yearly'

function getTimeRange(type: RecordType): { start: string, end: string } {
  const now = dayjs()
  const start = now.startOf(type === 'daily' ? 'day' : type === 'weekly' ? 'week' : type === 'monthly' ? 'month' : 'year')
  const end = now.endOf(type === 'daily' ? 'day' : type === 'weekly' ? 'week' : type === 'monthly' ? 'month' : 'year')
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

function extractRelevantData(toolId: string, data: Record<string, any>): string {
  if (!data || typeof data !== 'object')
    return ''
  if (toolId === 'git_directory' || toolId === 'git') {
    const parts: string[] = []
    if (typeof data.total_insertions === 'number' && typeof data.total_deletions === 'number')
      parts.push(`变更: +${data.total_insertions} -${data.total_deletions}`)
    if (Array.isArray(data.files)) {
      const fileInfo = data.files
        .filter((f: any) => f && typeof f === 'object')
        .map((f: any) => f.path && f.status ? `${f.path} (${f.status})` : null)
        .filter(Boolean)
      if (fileInfo.length > 0)
        parts.push(`文件: ${fileInfo.join(', ')}`)
    }
    return parts.join(', ')
  }
  if (toolId === 'clickup') {
    const parts: string[] = []
    if (data.status?.status)
      parts.push(`状态: ${data.status.status}`)
    if (data.list?.name)
      parts.push(`列表: ${data.list.name}`)
    return parts.join(', ')
  }
  return ''
}

export async function getRecordSummaryPrompt(
  recordType: RecordType = 'daily',
  workspaceId?: number,
): Promise<string> {
  const { start, end } = getTimeRange(recordType)
  const [sources, records] = await Promise.all([
    getSources(),
    db
      .selectFrom('record')
      .selectAll()
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end)
      .$if(workspaceId != null, q => q.where('workspaceId', '=', workspaceId!))
      .orderBy('createdAt', 'desc')
      .execute(),
  ])

  const sourceMap = new Map(sources.map(s => [s.id, s]))
  const grouped = new Map<string, Array<{ summary: string, data: any }>>()

  for (const rec of records) {
    const key = rec.source
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    const data = typeof rec.data === 'string' ? JSON.parse(rec.data || '{}') : (rec.data || {})
    grouped.get(key)!.push({
      summary: rec.summary,
      data,
    })
  }

  if (grouped.size === 0)
    return 'No record data available.'

  const lines: string[] = []
  for (const [sourceId, recs] of grouped) {
    const source = sourceMap.get(sourceId)
    const name = source?.name ?? sourceId
    const tool = source?.tool ?? ''
    lines.push(`${name} (${tool})\n`)
    for (const r of recs) {
      lines.push(`- ${r.summary}`)
      const extracted = extractRelevantData(tool || sourceId, r.data)
      if (extracted)
        lines.push(`  ${extracted}`)
    }
  }
  return lines.join('\n')
}
