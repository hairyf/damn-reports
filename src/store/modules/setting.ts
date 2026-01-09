import { Store } from '@tauri-apps/plugin-store'
import { defineStore } from 'valtio-define'

export type ThemeMode = 'light' | 'dark' | 'system'
export type Language = 'zh-CN' | 'en-US'

export const setting = defineStore({
  state: () => ({
    language: 'zh-CN' as Language,
    autoSave: true,
    notifications: true,
    autoCheckUpdate: true,
    deepseekApiKey: '',
  }),
})

Store.load('.setting.dat').then((store) => {
  store.get('setting').then((value: any) => {
    value && Object.assign(setting.$state, value)
  })
  setting.$subscribe((state) => {
    store.set('setting', state)
  })
})
