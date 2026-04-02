import type { Tool } from '@/store/modules/tool'
import type { Collector } from '@/utils/exec'
import { tool } from 'ai'
import { z } from 'zod'
import { executeCollector, executeCommand } from '@/utils/exec'

/** Schema definition for a single tool parameter */
interface ParamSchema {
  type?: string
  description?: string
  optional?: boolean
  default?: string | number | boolean
}

/**
 * Resolve and validate collector params against tool definition schema.
 * Applies defaults, handles optional params.
 */
function executeCollectorParams(
  tool: Tool,
  params: Record<string, any>,
): Record<string, any> {
  const config = { ...params }

  if (!tool.definition) {
    return config
  }
  for (const [key, schema] of Object.entries(tool.definition) as [string, ParamSchema][]) {
    const val = params[key]
    const absent = val === undefined || val === ''

    if (absent && schema.default !== undefined) {
      config[key] = schema.default
    }
    else if (absent && schema.optional) {
      config[key] = ''
    }
    else if (absent) {
      const desc = schema.description || schema.type || key
      throw new Error(
        `Missing required parameter for tool "${tool.id}": ${key}. `
        + `Expected: ${desc}. Provided params: ${JSON.stringify(params)}`,
      )
    }
  }

  return config
}

export const exec = tool({
  description: '执行命令',
  inputSchema: z.object({
    command: z.string().describe('要执行的命令'),
  }),
  execute: async ({ command }) => {
    if (!command?.trim())
      throw new Error('Provide a command to execute.')
    return executeCommand(command)
  },
})

export const exec_tool = tool({
  description: '执行指定 tool.json 中的工具',
  inputSchema: z.object({
    toolid: z.string().describe('要执行的工具 ID(key)'),
    params: z.record(z.string(), z.any()).describe('工具参数').optional(),
  }),
  execute: async ({ toolid, params = {} }) => {
    await store.tool.sync()
    const tool = store.tool.$state.raw[toolid]
    if (!tool) {
      const available = Object.keys(store.tool.$state.raw).join(', ')
      throw new Error(
        `Tool "${toolid}" not found in tool.json. Available tools: ${available}`,
      )
    }

    try {
      const config = executeCollectorParams(tool, params)
      return await executeCollector(tool as Collector, config)
    }
    catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      const toolLabel = tool.name || tool.type || toolid
      throw new Error(
        `exec_tool "${toolid}" (${toolLabel}) failed.\n`
        + `Type: ${tool.type ?? 'unknown'}\n`
        + `Params: ${JSON.stringify(params)}\n`
        + `Error: ${msg}`,
      )
    }
  },
})
