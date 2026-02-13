import type { Update } from '@tauri-apps/plugin-updater'
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
      await this.updater.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            this.progress = 0
            contentLength = event.data.contentLength ?? 0
            break
          case 'Progress':
            downloaded += event.data.chunkLength
            this.progress = Math.round((downloaded / contentLength) * 100)
            break
          case 'Finished':
            this.progress = 100
            break
        }
      })
      this.downloading = false
    },
    async checkAndInstall(): Promise<boolean> {
      await this.check()
      await this.install()
      return this.available
    },
  },
})
