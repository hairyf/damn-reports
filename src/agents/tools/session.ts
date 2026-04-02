import { tool } from 'ai'
import { z } from 'zod'
import { MAIN_SESSION_ID } from '@/config/constants'

export const clear_main_session = tool({
  description: '清空主会话的消息',
  inputSchema: z.object({}),
  execute: () => store.session.clear(MAIN_SESSION_ID),
})
