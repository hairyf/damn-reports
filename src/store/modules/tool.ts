import { defineStore } from 'valtio-define'

export interface Tool {
  name: string
  description: string
  type: string
  definition?: Record<string, any>
  executor?: Record<string, any>
  transformer?: string
  files?: string[]
}

export const tool = defineStore({
  state: () => ({
    raw: {} as Record<string, Tool>,
  }),
  persist: {
    key: 'tool',
    storage: {
      getItem: async () => ({ raw: await readJson('tools.json') }),
      setItem: async (_: string, value: any) => await writeJson('tools.json', value.raw),
    },
  },
})
