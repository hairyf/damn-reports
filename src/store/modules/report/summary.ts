import dayjs from 'dayjs'
import { stringifyData } from './utils'

export interface SourceItem {
  id: string
  name?: string
  tool?: string
}

export async function buildRecordSummaryPrompt(sources: SourceItem[]): Promise<string> {
  const records = await db.record.findMany({ date: dayjs().toISOString() })

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
