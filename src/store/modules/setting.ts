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
    collectTime: '05:45', // 数据收集时间，格式 HH:mm
    generateTime: '05:50', // 报告生成时间，格式 HH:mm
  }),
})

Store.load('.store.dat').then((store) => {
  store.get('setting').then((value: any) => value
    ? Object.assign(setting.$state, value)
    : store.set('setting', setting.$state))
  setting.$subscribe(state => store.set('setting', state))
})
