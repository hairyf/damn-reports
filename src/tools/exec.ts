import type { Collector } from '@/utils/exec'
import { tool } from 'ai'
import { z } from 'zod'
import { executeCollector, executeCommand } from '@/utils/exec'
import * as fs from '@/utils/fs-extra'

/** Schema definition for a single tool parameter */
interface ParamSchema {
  type?: string
  description?: string
  optional?: boolean
  default?: string | number | boolean
}

/** Tool definition from tools.json */
interface ToolDef {
  name?: string
  type?: string
  definition?: Record<string, ParamSchema>
  [key: string]: any
}

class ToolInputError extends Error {
  readonly status = 400

  constructor(message: string) {
    super(message)
    this.name = 'ToolInputError'
  }
}

/**
 * Load and parse tools.json from workspace.
 * @throws {Error} When file cannot be read or parsed
 */
async function loadToolsConfig(): Promise<Record<string, ToolDef>> {
  try {
    return await fs.readJson('tools.json') as Record<string, ToolDef>
  }
  catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to read tools.json: ${msg}`)
  }
}

/**
 * Resolve and validate collector params against tool definition schema.
 * Applies defaults, handles optional params.
 */
function resolveCollectorParams(
  toolid: string,
  toolDef: ToolDef,
  params: Record<string, any>,
): Record<string, any> {
  const config = { ...params }

  if (!toolDef.definition) {
    return config
  }

  for (const [key, schema] of Object.entries(toolDef.definition) as [string, ParamSchema][]) {
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
      throw new ToolInputError(
        `Missing required parameter for tool "${toolid}": ${key}. `
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
    if (!command?.trim()) {
      throw new ToolInputError('Provide a command to execute.')
    }
    return executeCommand(command)
  },
})

export const exec_tool = tool({
  description: '执行指定 tools.json 中的工具',
  inputSchema: z.object({
    toolid: z.string().describe('要执行的工具 ID(key)'),
    params: z.record(z.string(), z.any()).describe('工具参数').optional(),
  }),
  execute: async ({ toolid, params = {} }) => {
    const tools = await loadToolsConfig()

    const toolDef = tools[toolid]
    if (!toolDef) {
      const available = Object.keys(tools).join(', ')
      throw new ToolInputError(
        `Tool "${toolid}" not found in tools.json. Available tools: ${available}`,
      )
    }

    const config = resolveCollectorParams(toolid, toolDef, params)

    try {
      return await executeCollector(toolDef as Collector, config)
    }
    catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      const toolLabel = toolDef.name || toolDef.type || toolid
      throw new Error(
        `exec_tool "${toolid}" (${toolLabel}) failed.\n`
        + `Type: ${toolDef.type ?? 'unknown'}\n`
        + `Params: ${JSON.stringify(params)}\n`
        + `Error: ${msg}`,
      )
    }
  },
})
