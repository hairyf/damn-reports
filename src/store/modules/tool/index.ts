import { defineStore } from 'valtio-define'

export interface Tool {
  id: string
  name: string
  description: string
  type: string
  enable?: boolean
  definition?: Record<string, any>
  executor?: Record<string, any>
  transformer?: string
  files?: string[]
}

export const tool = defineStore({
  state: () => ({
    raw: {} as Record<string, Tool>,
  }),
  getters: {
    options(): Array<{ id: string, name: string }> {
      return Object.entries(this.raw).map(([id, def]) => ({
        id,
        name: def?.name ?? id,
      }))
    },
  },
  actions: {
    async sync() {
      this.raw = await readJson('tool.json').catch(() => ({}))
    },
    async set(value: Record<string, Tool>) {
      this.raw = value
      await writeJson('tool.json', value)
    },
  },
})

tool.sync()
