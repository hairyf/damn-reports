import { listen } from '@tauri-apps/api/event'
import { defineStore } from 'valtio-define'
import 'valtio-define/types'

export type ThemeMode = 'light' | 'dark' | 'system'
export type Language = 'zh-CN' | 'en-US'

export const setting = defineStore(
  {
    state: () => ({
      installed: false,
      ininitialized: false,
      language: 'zh-CN' as Language,
      autoSave: true,
      notifications: true,
      autoCheckUpdate: true,
    }),
    persist: {
      key: 'setting',
      storage,
    },
  },
)

listen<typeof setting.$state>('setting_updated', event => setting.$patch(event.payload))
