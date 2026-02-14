import { tool } from 'ai'
import dayjs from 'dayjs'
import { z } from 'zod'

export const date = tool({
  description: '获取当前日期',
  inputSchema: z.object({}),
  execute: () => dayjs().format('YYYY-MM-DD HH:mm:ss'),
})
