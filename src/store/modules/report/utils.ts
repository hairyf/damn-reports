import dayjs from 'dayjs'

import { MAX_DATA_SIZE } from './types'

export interface SourceItem {
  id: string
  name?: string
  tool?: string
  /** 禁用时不参与日报生成 */
  enable?: boolean
}
export function stringifyData(data: unknown): string | undefined {
  if (!data)
    return undefined
  const json = typeof data === 'string' ? data : JSON.stringify(data)
  if (json.length > MAX_DATA_SIZE)
    return `${json.slice(0, MAX_DATA_SIZE)}...`
  return json
}

export async function buildRecordSummaryPrompt(sources: SourceItem[]): Promise<string> {
  const enabledIds = sources.filter(s => s.enable !== false).map(s => s.id)
  if (enabledIds.length === 0)
    return 'No record data available.'

  const records = await db.record.findMany({
    date: dayjs().toISOString(),
    sourceIds: enabledIds,
  })

  const sourceMap = new Map(sources.map(s => [s.id, s]))
  const grouped = new Map<string, Array<{ summary: string, data: unknown }>>()

  for (const rec of records) {
    const key = rec.source
    if (!grouped.has(key))
      grouped.set(key, [])
    grouped.get(key)!.push({ summary: rec.summary, data: rec.data })
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
      const dataStr = stringifyData(r.data)
      lines.push(`- ${r.summary}`)
      if (dataStr)
        lines.push(`  data: ${dataStr}`)
    }
  }
  return lines.join('\n')
}
