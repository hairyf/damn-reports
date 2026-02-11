import { listen } from '@tauri-apps/api/event'
import { defineStore } from 'valtio-define'
import 'valtio-define/types'

export type ThemeMode = 'light' | 'dark' | 'system'
export type Language = 'zh-CN' | 'en-US'

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
      ininitialized() {
        return this.isLlmEnvConfigured || !!this.llmApiKey
      },
    },
    persist: {
      key: 'setting',
      storage,
    },
  },
)

listen<typeof setting.$state>('setting_updated', event => setting.$patch(event.payload))
