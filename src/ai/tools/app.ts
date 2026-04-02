import { tool } from 'ai'
import { z } from 'zod'
import { store } from '@/store'

export const sync_records = tool({
  description: '同步记录并返回收集到的数量',
  inputSchema: z.object({}),
  execute: () => store.source.collect(),
})

export const generate_report = tool({
  description: '同步记录并生成、保存当天的日报',
  inputSchema: z.object({}),
  execute: () => store.report.generate(),
})

export const get_settings = tool({
  description: '获取应用设置（LLM 模型、用户界面、通知、自动保存）',
  inputSchema: z.object({}),
  execute: () => store.setting.$state,
})

export const set_settings = tool({
  description: '设置应用设置',
  inputSchema: z.object({
    patchSettings: z.record(z.string(), z.any()).describe('应用设置'),
  }),
  execute: ({ patchSettings }) => store.setting.$patch(patchSettings),
})
