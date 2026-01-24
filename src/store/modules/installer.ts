import { listen } from '@tauri-apps/api/event'
import { defineStore } from 'valtio-define'

export const installer = defineStore({
  state: () => ({
    title: '正在准备安装...',
    type: null as 'download' | 'extract' | null,
    percentage: 0,
    progress: 0,
    detail: '',
  }),
})

listen<typeof installer.$state>('install-progress', (event) => {
  installer.$patch(event.payload)
})
