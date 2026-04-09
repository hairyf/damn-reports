import { tool } from 'ai'
import { z } from 'zod'
import { store } from '@/store'

export const application = tool({
  description: '应用级操作：同步记录、生成日报、获取/设置应用设置',
  inputSchema: z.object({
    action: z.enum(['record_sync', 'report_generate', 'setting_list', 'setting_set']),
    params: z.object({
      // `setting_set` 需要 patchSetting；其它 action 允许传空对象 `{}`。
      // 由于工具参数的 JSON schema 生成限制，这里将其标记为可选，
      // 真正的“必须性”在 execute 里做运行时校验。
      patchSetting: z
        .record(z.string(), z.any())
        .describe('应用设置补丁')
        .optional(),
    }),
  }),
  execute: async ({ action, params }) => {
    switch (action) {
      case 'record_sync':
        return store.source.collect()
      case 'report_generate':
        return store.report.generate()
      case 'setting_list':
        return store.setting.$state
      case 'setting_set':
        if (!params.patchSetting) {
          throw new Error('setting_set 需要 params.patchSetting')
        }
        return store.setting.$patch(params.patchSetting)
      default: {
        throw new Error(`Unknown action: ${action}`)
      }
    }
  },
})
