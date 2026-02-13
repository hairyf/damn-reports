import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import dayjs from 'dayjs'
import { defineStore } from 'valtio-define'
import { dailyReportPrompt } from '@/config/prompts'
import { store } from '@/store'
import 'valtio-define/types'

export type RecordType = 'daily' | 'weekly' | 'monthly' | 'yearly'

const MAX_DATA_SIZE = 2048

function stringifyData(data: any): string | undefined {
  if (!data)
    return undefined
  const json = typeof data === 'string' ? data : JSON.stringify(data)
  if (json.length > MAX_DATA_SIZE)
    return `${json.slice(0, MAX_DATA_SIZE)}...`
  return json
}

async function buildRecordSummaryPrompt(): Promise<string> {
  const sources = store.source.raw
  const records = await db.record.findMany({ date: dayjs().toISOString() })

  const sourceMap = new Map(sources.map(s => [s.id, s]))
  const grouped = new Map<string, Array<{ summary: string, data: any }>>()

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

/** 使用当前设置调用 LLM 生成日报正文 */
async function generateReportContent(systemPrompt: string): Promise<string> {
  const { llmApiKey, llmBaseUrl, llmModel } = store.setting
  if (!llmApiKey?.trim()) {
    throw new Error('请先在设置中配置 LLM API Key')
  }

  const baseURL = llmBaseUrl?.trim().replace(/\/$/, '')
  const openai = createOpenAI({
    apiKey: llmApiKey,
    baseURL: baseURL || undefined,
  })
  const { text } = await generateText({
    model: openai.chat(llmModel || 'deepseek-chat'),
    system: systemPrompt,
    prompt: '',
  })
  return text
}

export const llm = defineStore({
  state: () => ({
    loading: false,
  }),
  actions: {
    /** 生成日报：前端取 workspace → buildRecordSummaryPrompt 取摘要 → LLM → 前端 SQL 保存。 */
    async generateDailyReport() {
      this.loading = true
      try {
        const ws = await db.workspace.findFirst()
        if (ws == null) {
          throw new Error('未找到工作区，请先完成初始化')
        }
        const workspaceId = ws.id as number

        const summary = await buildRecordSummaryPrompt()

        if (!summary?.trim() || summary === 'No record data available.') {
          return
        }

        const fullPrompt = dailyReportPrompt(summary)
        const content = await generateReportContent(fullPrompt)

        const now = new Date().toISOString()
        const name = `日报 ${new Date().toLocaleDateString('sv-SE')}`
        await db.report.create({
          name,
          type: 'daily',
          content,
          workspaceId,
          updatedAt: now,
        })
      }
      finally {
        this.loading = false
      }
    },
  },
})
