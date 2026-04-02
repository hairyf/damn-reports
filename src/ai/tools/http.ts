import { tool } from 'ai'
import { z } from 'zod'

export const http = tool({
  description: '执行 HTTP 请求（Fetch）',
  inputSchema: z.object({
    input: z.any(),
    init: z.record(z.string(), z.any()).describe('HTTP 请求参数'),
  }),
  execute: async ({ input, init }) => {
    const response = await fetch(input, init)
    return response.text()
  },
})
