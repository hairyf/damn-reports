import { ToolLoopAgent } from 'ai'
import { defineAgent } from '@/utils/define'

export const defaultAgent = defineAgent({
  setup: model => new ToolLoopAgent({
    model,
  }),
})
