import * as fs from '@/utils/fs-extra'

const TOOLS_PATH = 'tools.json'

export interface ToolDef {
  name: string
  description: string
  type: string
  definition?: Record<string, any>
  executor?: Record<string, any>
  transformer?: string
  files?: string[]
}

export async function getTools(): Promise<Record<string, ToolDef>> {
  const data = await fs.readJson(TOOLS_PATH).catch(() => ({}))
  return typeof data === 'object' && data !== null ? data : {}
}

export async function getToolOptions(): Promise<Array<{ id: string, name: string }>> {
  const tools = await getTools()
  return Object.entries(tools).map(([id, def]) => ({
    id,
    name: def?.name ?? id,
  }))
}
