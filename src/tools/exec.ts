import { tool } from 'ai'
import { z } from 'zod'
import { executeCommand } from '@/utils/exec'

export const exec = tool({
  description: '执行命令',
  inputSchema: z.object({
    command: z.string().describe('要执行的命令'),
  }),
  execute: async ({ command }) => executeCommand(command),
})
