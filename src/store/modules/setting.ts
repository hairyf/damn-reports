import { debounce } from '@hairy/utils'
import { invoke } from '@tauri-apps/api/core'
import { defineStore } from 'valtio-define'

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
  },
)

const restartSchedule = debounce(() => invoke('restart_schedule'), 1000)

storage.getItem<any>('setting').then(store =>
  !store
    ? storage.setItem('setting', setting.$state)
    : setting.$patch(store),
)
setting.$subscribe(async (state) => {
  await storage.setItem('setting', state)
  restartSchedule()
})
