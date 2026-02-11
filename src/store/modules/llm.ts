import { createOpenAI } from '@ai-sdk/openai'
import { invoke } from '@tauri-apps/api/core'
import { generateText } from 'ai'
import { defineStore } from 'valtio-define'
import { dailyReportPrompt } from '@/config/prompts'
import { store } from '@/store'
import 'valtio-define/types'

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
    /** 生成日报：前端取 workspace → invoke 取摘要 → LLM → 前端 SQL 保存。 */
    async generateDailyReport() {
      this.loading = true
      try {
        const ws = await db.workspace.findFirst()
        if (ws == null) {
          throw new Error('未找到工作区，请先完成初始化')
        }
        const workspaceId = ws.id as number

        const summary = await invoke<string>('get_record_summary', { workspaceId })

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
