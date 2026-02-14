/* eslint-disable no-console */
import type { CronJob, CronJobPatch, CronStoreFile } from '@/cron/types'
import { defineStore } from 'valtio-define'
import { CronService } from '@/cron/service'
import { store } from '@/store'
import { MAIN_SESSION_ID } from '@/store/modules/chat'

// ── Default jobs (migrate from Rust scheduler) ──

const DEFAULT_CRONS: CronStoreFile = {
  version: 1,
  jobs: [
    {
      id: 'builtin_daily_report',
      name: '每日报告生成',
      description: '在设定时间自动收集数据并生成日报',
      enabled: true,
      system: true,
      schedule: { kind: 'workday', time: '18:00', region: 'CN' },
      payload: { kind: 'report' },
      state: {},
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
    },
    {
      id: 'builtin_memory_clear',
      name: '主会话记忆存储',
      description: '每日零点存储主会话记忆并清空',
      enabled: true,
      system: true,
      view: false,
      schedule: { kind: 'cron', expr: '0 0 * * *' },
      payload: { kind: 'agentTurn', message: '储存今天的记忆' },
      state: {},
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
    },
  ],
}

// ── Singleton service ──

let service: CronService | null = null

export const cron = defineStore({
  state: () => ({
    jobs: [] as CronJob[],
    running: false,
  }),
  actions: {
    async start() {
      if (service)
        return

      service = new CronService({
        load: async () => {
          try {
            const data = await readJson('crons.json') as CronStoreFile
            // 迁移：为未指定时区的 cron 补充国内时区；将工作日 cron/cnWorkday 转为 workday（支持补班）
            let migrated = false
            for (const job of data.jobs) {
              if (job.schedule.kind === 'cron' && !job.schedule.tz) {
                job.schedule.tz = 'Asia/Shanghai'
                migrated = true
              }
              const sch = job.schedule as { kind: string, expr?: string }
              const isLegacyWorkday = (sch.kind === 'cron' && sch.expr === '0 18 * * 1-5') || sch.kind === 'cnWorkday'
              if (job.id === 'builtin_daily_report' && isLegacyWorkday) {
                job.schedule = { kind: 'workday', time: '18:00', region: 'CN' }
                migrated = true
              }
              if (job.id === 'builtin_daily_report' && !job.system) {
                job.system = true
                migrated = true
              }
              if (job.id === 'builtin_memory_clear') {
                if (!job.system) {
                  job.system = true
                  migrated = true
                }
                if (job.view !== false) {
                  job.view = false
                  migrated = true
                }
              }
            }
            if (migrated)
              await writeJson('crons.json', data)
            return data
          }
          catch {
            // First run: create default crons
            await writeJson('crons.json', DEFAULT_CRONS)
            return DEFAULT_CRONS
          }
        },
        save: async (data: CronStoreFile) => {
          await writeJson('crons.json', data)
          // Sync reactive state
          this.jobs = [...data.jobs]
        },
        deps: {
          collect: () => store.source.collect(),
          generateReport: () => store.report.generate(),
          sendChatMessage: async (message: string) => {
            store.chat.activate(MAIN_SESSION_ID)
            await store.chat.send(message)
          },
        },
        onEvent: (evt) => {
          console.info('[cron] event:', evt)
          // Refresh job list on any change
          this.sync()
        },
      })

      await service.start()
      this.running = true
      await this.sync()
    },

    stop() {
      service?.stop()
      service = null
      this.running = false
    },

    async sync() {
      if (!service)
        return
      this.jobs = await service.list()
    },

    async remove(id: string): Promise<boolean> {
      if (!service)
        throw new Error('cron service not started')
      const result = await service.remove(id)
      await this.sync()
      return result
    },

    async run(id: string) {
      if (!service)
        throw new Error('cron service not started')
      const result = await service.run(id)
      await this.sync()
      return result
    },

    async update(id: string, patch: CronJobPatch) {
      if (!service)
        throw new Error('cron service not started')
      const result = await service.update(id, patch)
      await this.sync()
      return result
    },

    async toggle(id: string) {
      const job = this.jobs.find(j => j.id === id)
      if (!job)
        return
      await this.update(id, { enabled: !job.enabled })
    },
  },
})
