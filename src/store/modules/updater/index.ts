import type { Update } from '@tauri-apps/plugin-updater'
import { addToast } from '@heroui/react'
import { check } from '@tauri-apps/plugin-updater'
import { defineStore } from 'valtio-define'

export const updater = defineStore({
  state: () => ({
    checked: false,
    updater: null as Update | null,
    available: false,
    downloading: false,
    progress: 0,
  }),
  actions: {
    async check(): Promise<boolean> {
      this.updater = await check()
      return this.available = !!this.updater
    },
    async install() {
      if (!this.updater)
        return
      this.downloading = true
      let downloaded = 0
      let contentLength = 0

      try {
        await this.updater.downloadAndInstall((event) => {
          switch (event.event) {
            case 'Started':
              this.progress = 0
              contentLength = event.data.contentLength ?? 0
              break
            case 'Progress': {
              const chunkLength = event.data.chunkLength ?? 0
              downloaded += chunkLength
              if (contentLength > 0) {
                this.progress = Math.round((downloaded / contentLength) * 100)
              }
              break
            }
            case 'Finished':
              this.progress = 100
              break
          }
        })
      }
      catch (error) {
        addToast({
          title: '更新失败',
          description: error instanceof Error ? error.message : String(error),
          color: 'danger',
        })
        console.error('[updater] install failed:', error)
      }
      finally {
        this.downloading = false
      }
    },
    async checkAndInstall(): Promise<boolean> {
      await this.check()
      await this.install()
      return this.available
    },
  },
})
