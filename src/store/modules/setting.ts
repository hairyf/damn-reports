import { listen } from '@tauri-apps/api/event'
import { defineStore } from 'valtio-define'
import 'valtio-define/types'

export type ThemeMode = 'light' | 'dark' | 'system'
export type Language = 'zh-CN' | 'en-US'

/** 从 Vite 环境变量读取 LLM 配置（需 VITE_ 前缀） */
const envLlmApiKey = import.meta.env.VITE_LLM_API_KEY as string | undefined
const envLlmBaseUrl = import.meta.env.VITE_LLM_BASE_URL as string | undefined

export const setting = defineStore(
  {
    state: () => ({
      language: 'zh-CN' as Language,
      autoSave: true,
      notifications: true,
      autoCheckUpdate: true,
      dailyReportTime: '18:00',
      llmApiKey: '',
      llmBaseUrl: 'https://api.deepseek.com',
      llmModel: 'deepseek-chat',
      isLlmEnvConfigured: false,
    }),
    getters: {
      /** 是否由 Vite 环境变量配置 */
      effectiveIsLlmEnvConfigured() {
        return !!envLlmApiKey?.trim()
      },
      /** 实际使用的 API Key（环境变量优先） */
      effectiveLlmApiKey() {
        return envLlmApiKey?.trim() || this.llmApiKey || ''
      },
      /** 实际使用的 Base URL（环境变量优先） */
      effectiveLlmBaseUrl() {
        return envLlmBaseUrl?.trim() || this.llmBaseUrl || 'https://api.deepseek.com'
      },
      ininitialized() {
        return !!envLlmApiKey?.trim() || !!this.llmApiKey
      },
    },
    persist: {
      key: 'setting',
      storage,
    },
  },
)

listen<typeof setting.$state>('setting_updated', event => setting.$patch(event.payload))
