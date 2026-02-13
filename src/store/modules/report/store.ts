import { addToast } from '@heroui/react'
import dayjs from 'dayjs'
import { defineStore } from 'valtio-define'
import { queryClient } from '@/config/client'
import { dailyReportPrompt, optimizeReportPrompt } from '@/config/prompts'
import { store } from '@/store'
import { buildRecordSummaryPrompt } from './summary'
import 'valtio-define/types'

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
      try {
        return await store.llm.streamGenerateText(systemPrompt, (delta) => {
          this.streamingContent += delta
        })
      }
      finally {
        this.loading = false
      }
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
          throw new Error('未收集到任何数据')
        }

        const summary = await buildRecordSummaryPrompt(store.source.raw)
        if (!summary?.trim() || summary === 'No record data available.') {
          throw new Error('没有可用的记录数据')
        }

        const content = await this.streamGenerate(dailyReportPrompt(summary))

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
        this.clearStreaming()

        return content
      }
      catch (error) {
        console.error('generateDailyReport error', error)
        throw error
      }
      finally {
        this.loading = false
      }
    },

    /** 重新生成：基于最新数据重新生成并更新已有报告 */
    async regenerateReport(reportId: string) {
      try {
        const summary = await buildRecordSummaryPrompt(store.source.raw)
        if (!summary?.trim() || summary === 'No record data available.') {
          throw new Error('没有可用的记录数据')
        }

        const content = await this.streamGenerate(dailyReportPrompt(summary))

        await db.report.update(reportId, {
          content,
          updatedAt: new Date().toISOString(),
        })
      }
      catch (error) {
        console.error('regenerateReport error', error)
        throw error
      }
      finally {
        this.loading = false
      }
    },

    /** 优化日报：基于当前内容优化表述并更新报告，可传入自定义提示词 */
    async optimizeReport(reportId: string, currentContent: string, userInstruction?: string) {
      try {
        const content = await this.streamGenerate(optimizeReportPrompt(currentContent, userInstruction))
        await db.report.update(reportId, {
          content,
          updatedAt: new Date().toISOString(),
        })
      }
      catch (error) {
        console.error('optimizeReport error', error)
        throw error
      }
      finally {
        this.loading = false
      }
    },
  },
})
