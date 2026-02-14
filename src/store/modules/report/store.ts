import { addToast } from '@heroui/react'
import dayjs from 'dayjs'
import { defineStore } from 'valtio-define'
import { queryClient } from '@/config/client'
import { dailyReportPrompt, optimizeReportPrompt } from '@/config/prompts'
import { notifyReportGenerated } from '@/cron/report-hook'
import { store } from '@/store'
import { buildRecordSummaryPrompt } from './utils'
import 'valtio-define/types'

/** 流式生成内容（模块内部使用），更新 streamingContent 并返回最终文本 */
async function streamGenerate(
  state: { loading: boolean, streamingContent: string },
  systemPrompt: string,
): Promise<string> {
  state.loading = true
  state.streamingContent = ''
  try {
    return await store.llm.streamGenerate(systemPrompt, (delta: string) => {
      state.streamingContent += delta
    })
  }
  finally {
    state.loading = false
  }
}

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

    /** 首次生成日报：收集数据摘要 → 流式生成 → 创建报告 */
    async generate(options?: { fromScheduled?: boolean }) {
      try {
        const summary = await collectAndSummarize()
        const content = await streamGenerate(this, dailyReportPrompt(summary))

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
        const content = await streamGenerate(this, dailyReportPrompt(summary))

        await db.report.update(reportId, {
          content,
          updatedAt: new Date().toISOString(),
        })
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
        const content = await streamGenerate(this, optimizeReportPrompt(currentContent, userInstruction))
        await db.report.update(reportId, {
          content,
          updatedAt: new Date().toISOString(),
        })
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
