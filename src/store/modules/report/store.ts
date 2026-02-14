import { addToast } from '@heroui/react'
import dayjs from 'dayjs'
import { defineStore } from 'valtio-define'
import { queryClient } from '@/config/client'
import { dailyReportPrompt, optimizeReportPrompt } from '@/config/prompts'
import { notifyReportGenerated } from '@/cron/report-hook'
import { store } from '@/store'
import { writeTextFile } from '@/utils/fs-extra'
import { buildRecordSummaryPrompt } from './utils'
import 'valtio-define/types'

/** 收集并验证记录数据，返回摘要 prompt */
async function collectAndSummarize(): Promise<string> {
  await store.source.collect()

  const records = await db.record.findMany({
    date: dayjs().startOf('day').toISOString(),
  })

  if (records.length === 0) {
    addToast({ title: '暂无数据', description: '未收集到任何数据' })
    throw new Error('未收集到任何数据')
  }

  const summary = await buildRecordSummaryPrompt(store.source.raw)
  if (!summary?.trim() || summary === 'No record data available.')
    throw new Error('没有可用的记录数据')

  return summary
}

/** 验证摘要数据可用性（不重新收集） */
async function ensureSummary(): Promise<string> {
  const summary = await buildRecordSummaryPrompt(store.source.raw)
  if (!summary?.trim() || summary === 'No record data available.')
    throw new Error('没有可用的记录数据')
  return summary
}

/** 将报告内容写入 memory/reports/YYYY-MM-DD.md */
async function writeReportToMemory(content: string, date?: string): Promise<void> {
  const reportPath = `memory/reports/${date ?? dayjs().format('YYYY-MM-DD')}.md`
  await writeTextFile(reportPath, content)
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
    /** 清除流式内容 */
    resetStream() {
      this.streamingContent = ''
    },

    /** 流式生成内容，更新 streamingContent 并返回最终文本 */
    async streamGenerate(systemPrompt: string, userPrompt: string): Promise<string> {
      const DEBUG = false
      this.loading = true
      this.streamingContent = ''
      const t0 = performance.now()
      if (DEBUG)
        console.warn('[report] streamGenerate start')

      try {
        const textStream = store.llm.streamGenerate({
          system: systemPrompt,
          prompt: userPrompt,
        })
        let chunkCount = 0
        for await (const delta of textStream) {
          chunkCount++
          this.streamingContent += delta
          if (DEBUG && chunkCount <= 3) {
            console.warn('[report] chunk', chunkCount, 'len', delta.length, 'total', this.streamingContent.length)
          }
        }
        if (DEBUG) {
          console.warn('[report] streamGenerate done', {
            chunkCount,
            totalLength: this.streamingContent.length,
            elapsed: `${(performance.now() - t0).toFixed(0)}ms`,
          })
        }
        return this.streamingContent
      }
      catch (error) {
        console.error('[report] streamGenerate error', {
          elapsed: `${(performance.now() - t0).toFixed(0)}ms`,
          contentLength: this.streamingContent.length,
          error,
        })
        throw error
      }
      finally {
        this.loading = false
        if (DEBUG)
          console.warn('[report] streamGenerate finally, loading=false')
      }
    },

    /** 首次生成日报：收集数据摘要 → 流式生成 → 创建报告 */
    async generate(options?: { fromScheduled?: boolean }): Promise<string> {
      try {
        const summary = await collectAndSummarize()
        const { system, prompt } = dailyReportPrompt(summary)
        const content = await this.streamGenerate(system, prompt)

        await db.report.create({
          name: `日报 ${new Date().toLocaleDateString('sv-SE')}`,
          type: 'daily',
          content,
          updatedAt: new Date().toISOString(),
        })

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['reports'] }),
          queryClient.invalidateQueries({ queryKey: ['records'] }),
        ])
        this.resetStream()

        notifyReportGenerated(content, options?.fromScheduled ?? false)

        try {
          await writeReportToMemory(content)
        }
        catch (err) { console.warn('writeReportToMemory failed', err) }

        return content
      }
      catch (error) {
        console.error('generate error', error)
        throw error
      }
      finally {
        this.loading = false
      }
    },

    /** 重新生成：基于最新数据重新生成并更新已有报告 */
    async regenerate(reportId: string) {
      try {
        const summary = await ensureSummary()
        const { system, prompt } = dailyReportPrompt(summary)
        const content = await this.streamGenerate(system, prompt)

        const existing = await db.report.findUnique(Number(reportId) as never)
        const reportDate = existing?.createdAt ? dayjs(existing.createdAt).format('YYYY-MM-DD') : undefined

        await db.report.update(reportId, {
          content,
          updatedAt: new Date().toISOString(),
        })

        try {
          await writeReportToMemory(content, reportDate)
        }
        catch (err) { console.warn('writeReportToMemory failed', err) }
      }
      catch (error) {
        console.error('regenerate error', error)
        throw error
      }
      finally {
        this.loading = false
      }
    },

    /** 优化日报：基于当前内容优化表述并更新报告 */
    async optimize(reportId: string, currentContent: string, userInstruction?: string) {
      try {
        const { system, prompt } = optimizeReportPrompt(currentContent, userInstruction)
        const content = await this.streamGenerate(system, prompt)
        const existing = await db.report.findUnique(Number(reportId) as never)
        const reportDate = existing?.createdAt ? dayjs(existing.createdAt).format('YYYY-MM-DD') : undefined

        await db.report.update(reportId, {
          content,
          updatedAt: new Date().toISOString(),
        })

        try {
          await writeReportToMemory(content, reportDate)
        }
        catch (err) { console.warn('writeReportToMemory failed', err) }
      }
      catch (error) {
        console.error('optimize error', error)
        throw error
      }
      finally {
        this.loading = false
      }
    },
  },
})
