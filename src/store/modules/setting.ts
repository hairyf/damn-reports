import { debounce } from '@hairy/utils'
import { invoke } from '@tauri-apps/api/core'
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
      collectTime: '17:45',
      generateTime: '17:50',
    }),
    persist: {
      key: 'setting',
      storage,
    },
  },
)
const restart_schedule = debounce(() => invoke('restart_schedule'), 500)

setting.$subscribeKey('collectTime', restart_schedule)
setting.$subscribeKey('generateTime', restart_schedule)
