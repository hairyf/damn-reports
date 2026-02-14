/* eslint-disable no-console */
import { tool } from 'ai'
import { z } from 'zod'

import * as fs from '@/utils/fs-extra'

export const exec = tool({
  description: '执行命令',
  inputSchema: z.object({
    command: z.string().describe('要执行的命令'),
  }),
  execute: async ({ command }) => executeCommand(command),
})

export const exec_tool = tool({
  description: '执行指定 tools.json 中的工具',
  inputSchema: z.object({
    toolid: z.string().describe('要执行的工具 ID(key)'),
    params: z.record(z.string(), z.any()).describe('工具参数').optional(),
  }),
  execute: async ({ toolid, params = {} }) => {
    let tools: Record<string, any>
    try {
      tools = await fs.readJson('tools.json')
    }
    catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to read tools.json: ${msg}`)
    }

    const toolDef = tools[toolid]
    if (!toolDef) {
      const available = Object.keys(tools).join(', ')
      throw new Error(
        `Tool "${toolid}" not found in tools.json.\n`
        + `Available tools: ${available}`,
      )
    }

    const config: Record<string, any> = { ...params }
    if (toolDef.definition) {
      for (const [key, schema] of Object.entries(toolDef.definition) as [string, any][]) {
        const val = params[key]
        const absent = val === undefined || val === ''

        if (absent && schema.default !== undefined) {
          config[key] = schema.default
        }
        else if (absent && schema.optional) {
          config[key] = ''
        }
        else if (absent) {
          throw new Error(
            `Missing required parameter for tool "${toolid}": ${key}\n`
            + `Description: ${schema.description || schema.type}\n`
            + `Provided params: ${JSON.stringify(params)}`,
          )
        }
      }
    }

    try {
      const data = await executeCollector(toolDef, config)
      console.log('Tool execution result:', data)
      return data
    }
    catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(
        `exec_tool "${toolid}" (${toolDef.name || toolDef.type}) failed.\n`
        + `Type: ${toolDef.type}\n`
        + `Params: ${JSON.stringify(params)}\n`
        + `Error: ${msg}`,
      )
    }
  },
})
