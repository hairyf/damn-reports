import type { UIMessage } from 'ai'

export interface Session {
  messages?: UIMessage[]
  agent: string
  model?: string
  id: string
}

export const session = defineStore({
  state: () => ({
    sessions: [] as Session[],
    current: null as string | null,
  }),
})
