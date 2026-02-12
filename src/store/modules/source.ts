import { defineStore } from 'valtio-define'

export interface Source {
  id: string
  name: string
  tool: string
  config: Record<string, any>
  createAt: string
  updateAt: string
}

export const source = defineStore({
  state: () => ({
    raw: [] as Source[],
  }),
  persist: {
    key: 'source',
    storage: {
      getItem: async () => ({ raw: await readJson('sources.json') }),
      setItem: async (_: string, value: any) => await writeJson('sources.json', value.raw),
    },
  },
})
