import { debounce } from '@hairy/utils'
import { invoke } from '@tauri-apps/api/core'
import { Store } from '@tauri-apps/plugin-store'
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

Store.load('.store.dat').then((store) => {
  store.get('setting').then((value: any) => value
    ? Object.assign(setting.$state, value)
    : store.set('setting', setting.$state))
  setting.$subscribe(async (state) => {
    await store.set('setting', state)
    restartSchedule()
  })
})
