import { addToast } from '@heroui/react'
import { streamText } from 'ai'
import dayjs from 'dayjs'
import { defineStore } from 'valtio-define'
import {
  buildDailyReportPrompt,
  buildDailyReportSystemPrompt,
  buildOptimizeReportPrompt,
  buildOptimizeReportSystemPrompt,
} from '@/ai'

import { queryClient } from '@/config/client'
import { notifyReportGenerated } from '@/cron/report'
import { store } from '@/store'
import { writeTextFile } from '@/utils/fs-extra'
import { buildRecordSummaryPrompt } from './utils'
import 'valtio-define/types'

// --- 辅助工具函数 ---

/** 将流式数据转换为文本序列 */
async function* pipeFullStreamToText(
  stream: AsyncIterable<{ type: string, text?: string, error?: unknown }>,
): AsyncIterable<string> {
  for await (const part of stream) {
    if (part.type === 'text-delta' && part.text)
      yield part.text
    if (part.type === 'error')
      throw part.error
    if (part.type === 'abort')
      throw new Error('Stream aborted')
  }
}

/** 统一验证摘要可用性 */
function validateSummary(summary: string): string {
  const isValid = summary?.trim() && summary !== 'No record data available.'
  if (!isValid) {
    addToast({ title: '无可用的记录数据', description: '启用中的数据源今日暂无记录' })
    throw new Error('没有可用的记录数据')
  }
  return summary
}

/** 将内容同步到文件系统（内存备份） */
async function safeWriteToMemory(content: string, date?: string) {
  try {
    const reportPath = `memory/reports/${date ?? dayjs().format('YYYY-MM-DD')}.md`
    await writeTextFile(reportPath, content)
  }
  catch (err) {
    console.warn('[report] Backup to memory failed:', err)
  }
}

// --- Store 定义 ---

export const report = defineStore({
  state: () => ({
    loading: false,
    streamingContent: '',
  }),
  getters: {
    isStreaming(): boolean {
      return this.loading && this.streamingContent.length > 0
    },
  },
  actions: {
    resetStream() {
      this.streamingContent = ''
    },

    /** 通用流式生成引擎 */
    async stream(systemPrompt: string, userPrompt: string): Promise<string> {
      this.loading = true
      this.resetStream() // 开始前自动重置
      const t0 = performance.now()

      try {
        const result = streamText({
          model: store.agent.getLanguageModel(),
          system: systemPrompt,
          prompt: userPrompt,
        })

        for await (const delta of pipeFullStreamToText(result.fullStream)) {
          this.streamingContent += delta
        }
        return this.streamingContent
      }
      catch (error) {
        console.error(`[report] stream failed (${Math.round(performance.now() - t0)}ms):`, error)
        throw error
      }
      finally {
        this.loading = false
      }
    },

    async upsert(
      reportId: string | null,
      content: string,
      options?: { createdAt?: string, fromScheduled?: boolean },
    ) {
      const updatedAt = new Date().toISOString()
      const reportDate = options?.createdAt ? dayjs(options.createdAt).format('YYYY-MM-DD') : undefined

      if (reportId) {
        // 更新现有报告
        await db.report.update(reportId, { content, updatedAt })
      }
      else {
        // 创建新报告
        await db.report.create({
          name: `日报 ${dayjs().format('YYYY-MM-DD')}`,
          type: 'daily',
          content,
          updatedAt,
        })
        notifyReportGenerated(content, options?.fromScheduled ?? false)
      }

      // 触发数据刷新与备份
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
        queryClient.invalidateQueries({ queryKey: ['records'] }),
        safeWriteToMemory(content, reportDate),
      ])
    },

    /** 首次生成日报 */
    async generate(options?: { fromScheduled?: boolean }): Promise<string> {
      try {
        await store.source.collect()
        const records = await db.record.findMany({ date: dayjs().startOf('day').toISOString() })

        if (records.length === 0) {
          addToast({ title: '暂无数据', description: '未收集到任何数据' })
          throw new Error('No records found')
        }

        const summary = validateSummary(await buildRecordSummaryPrompt(store.source.raw, records))
        const content = await this.stream(
          buildDailyReportSystemPrompt(),
          buildDailyReportPrompt(summary),
        )

        await this.upsert(null, content, { fromScheduled: options?.fromScheduled })
        return content
      }
      catch (error) {
        console.error('[report] generate error:', error)
        throw error
      }
    },

    /** 重新生成：基于最新数据 */
    async regenerate(reportId: string) {
      try {
        const summary = validateSummary(await buildRecordSummaryPrompt(store.source.raw))
        const existing = await db.report.findUnique(Number(reportId) as never)
        const content = await this.stream(
          buildDailyReportSystemPrompt(),
          buildDailyReportPrompt(summary),
        )

        await this.upsert(reportId, content, { createdAt: existing?.createdAt })
      }
      catch (error) {
        console.error('[report] regenerate error:', error)
        throw error
      }
    },

    /** 优化日报内容 */
    async optimize(reportId: string, currentContent: string, userInstruction?: string) {
      try {
        const existing = await db.report.findUnique(Number(reportId) as never)
        const content = await this.stream(
          buildOptimizeReportSystemPrompt(),
          buildOptimizeReportPrompt(currentContent, userInstruction),
        )

        await this.upsert(reportId, content, { createdAt: existing?.createdAt })
      }
      catch (error) {
        console.error('[report] optimize error:', error)
        throw error
      }
    },
  },
})
