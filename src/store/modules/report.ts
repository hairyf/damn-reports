import { createOpenAI } from '@ai-sdk/openai'
import { addToast } from '@heroui/react'
import { streamText } from 'ai'
import dayjs from 'dayjs'
import { defineStore } from 'valtio-define'
import { queryClient } from '@/config/client'
import { dailyReportPrompt, optimizeReportPrompt } from '@/config/prompts'
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

function createModel() {
  const { llmApiKey, llmBaseUrl, llmModel } = store.setting
  if (!llmApiKey?.trim()) {
    throw new Error('请先在设置中配置 LLM API Key')
  }
  return createOpenAI({
    apiKey: llmApiKey,
    baseURL: llmBaseUrl?.trim().replace(/\/$/, '') || undefined,
  }).chat(llmModel || 'deepseek-chat')
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

export const report = defineStore({
  state: () => ({
    loading: false,
    /** 流式生成过程中的实时文案 */
    streamingContent: '',
  }),
  getters: {
    /** 是否正在流式生成中 */
    isStreaming(): boolean {
      return this.loading && this.streamingContent.length > 0
    },
  },
  actions: {
    /** 清除流式内容（在调用方确认数据刷新后调用，避免闪烁） */
    clearStreaming() {
      this.streamingContent = ''
    },

    /** 流式生成内容（内部复用），更新 streamingContent 并返回最终文本 */
    async streamGenerate(systemPrompt: string): Promise<string> {
      this.loading = true
      this.streamingContent = ''
      const { textStream } = streamText({
        model: createModel(),
        system: systemPrompt,
        prompt: '',
      })
      for await (const delta of textStream) {
        this.streamingContent += delta
      }
      return this.streamingContent
    },

    /** 首次生成日报：收集数据摘要 → 流式生成 → 创建报告 */
    async generateDailyReport() {
      try {
        await store.source.collect()

        const records = await db.record.findMany({
          date: dayjs().startOf('day').toISOString(),
        })

        if (records.length === 0) {
          addToast({ title: '暂无数据', description: '未收集到任何数据' })
          return
        }

        const ws = await db.workspace.findFirst()
        if (ws == null)
          throw new Error('未找到工作区，请先完成初始化')

        const summary = await buildRecordSummaryPrompt()
        if (!summary?.trim() || summary === 'No record data available.') {
          return
        }

        const content = await this.streamGenerate(dailyReportPrompt(summary))

        await db.report.create({
          name: `日报 ${new Date().toLocaleDateString('sv-SE')}`,
          type: 'daily',
          content,
          workspaceId: ws.id as number,
          updatedAt: new Date().toISOString(),
        })

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['reports'] }),
          queryClient.invalidateQueries({ queryKey: ['records'] }),
        ])
        this.clearStreaming()
      }
      catch (error) {
        console.error('generateDailyReport error', error)
        addToast({
          title: '生成失败',
          description: error instanceof Error ? error.message : '未知错误',
          color: 'danger',
        })
      }
      finally {
        this.loading = false
      }
    },

    /** 重新生成：基于最新数据重新生成并更新已有报告 */
    async regenerateReport(reportId: number | string) {
      try {
        const summary = await buildRecordSummaryPrompt()
        if (!summary?.trim() || summary === 'No record data available.') {
          throw new Error('没有可用的记录数据')
        }

        const content = await this.streamGenerate(dailyReportPrompt(summary))

        await db.report.update(reportId, {
          content,
          updatedAt: new Date().toISOString(),
        })
      }
      finally {
        this.loading = false
      }
    },

    /** 优化日报：基于当前内容优化表述并更新报告，可传入自定义提示词 */
    async optimizeReport(reportId: number | string, currentContent: string, userInstruction?: string) {
      try {
        const content = await this.streamGenerate(optimizeReportPrompt(currentContent, userInstruction))

        await db.report.update(reportId, {
          content,
          updatedAt: new Date().toISOString(),
        })
      }
      finally {
        this.loading = false
      }
    },
  },
})
