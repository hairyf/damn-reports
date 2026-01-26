import type { Update } from '@tauri-apps/plugin-updater'
import { check } from '@tauri-apps/plugin-updater'
import { defineStore } from 'valtio-define'

export const updater = defineStore({
  state: () => ({
    checked: false,
    updater: null as Update | null,
    isNewVersion: false,
    isDownloading: false,
    progress: 0,
  }),
  actions: {
    async check() {
      this.updater = await check()
      this.isNewVersion = !!this.updater
    },
    async update() {
      if (!this.updater)
        return
      this.isDownloading = true
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
      this.isDownloading = false
    },
    async checkAndInstall(): Promise<boolean> {
      await this.check()
      await this.update()
      return this.isNewVersion
    },
  },
})
