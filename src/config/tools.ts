/* eslint-disable no-console */
import { tool } from 'ai'
import dayjs from 'dayjs'
import { sql } from 'kysely'
import { z } from 'zod'
import { executeCollector, executeCommand } from '../utils/exec'
import * as fs from '../utils/fs-extra'
// 辅助函数：将 Uint8Array 转为字符串
const decoder = new TextDecoder()
const encoder = new TextEncoder()

export const read = tool({
  description: '读取文件内容',
  inputSchema: z.object({ path: z.string() }),
  execute: async ({ path }) => {
    try {
      const data = await fs.readFile(path)
      return decoder.decode(data)
    }
    catch (error) {
      console.error(error)
      throw error
    }
  },
})

export const write = tool({
  description: '创建或覆盖文件',
  inputSchema: z.object({
    path: z.string(),
    content: z.string(),
  }),
  execute: async ({ path, content }) => {
    try {
      await fs.writeFile(path, encoder.encode(content))
      return `Successfully written to ${path}`
    }
    catch (error) {
      console.error(error)
      throw error
    }
  },
})

export const edit = tool({
  description: '对文件进行精确编辑（简单替换示例，建议根据需求优化为正则或行编辑）',
  inputSchema: z.object({
    path: z.string(),
    oldContent: z.string().describe('要被替换的旧文本'),
    newContent: z.string().describe('替换后的新文本'),
  }),
  execute: async ({ path, oldContent, newContent }) => {
    try {
      const data = await fs.readFile(path)
      const currentText = decoder.decode(data)
      const updatedText = currentText.replace(oldContent, newContent)
      await fs.writeFile(path, encoder.encode(updatedText))
      return `Updated ${path}`
    }
    catch (error) {
      console.error(error)
      throw error
    }
  },
})

export const grep = tool({
  description: '在文件中搜索特定模式',
  inputSchema: z.object({
    path: z.string(),
    pattern: z.string(),
  }),
  execute: async ({ path, pattern }) => {
    try {
      const data = await fs.readFile(path)
      const lines = decoder.decode(data).split('\n')
      const matches = lines
        .map((line, index) => line.includes(pattern) ? `${index + 1}: ${line}` : null)
        .filter(Boolean)
      return matches.length > 0 ? matches.join('\n') : 'No matches found.'
    }
    catch (error) {
      console.error(error)
      throw error
    }
  },
})

export const ls = tool({
  description: '列出目录内容',
  inputSchema: z.object({ path: z.string() }),
  execute: async ({ path }) => {
    try {
      const entries = await fs.readDir(path)
      const result = entries.map(e => `${e.isDirectory ? '[DIR]' : '[FILE]'} ${e.name}`).join('\n')
      return result
    }
    catch (error) {
      console.error(error)
      throw error
    }
  },
})

export const find = tool({
  description: '递归查找包含特定字符串的文件名',
  inputSchema: z.object({
    path: z.string(),
    query: z.string(),
  }),
  execute: async ({ path, query }) => {
    const results: string[] = []
    async function search(dir: string) {
      const entries = await fs.readDir(dir)
      for (const entry of entries) {
        const fullPath = `${dir}/${entry.name}`
        if (entry.name.includes(query))
          results.push(fullPath)
        if (entry.isDirectory)
          await search(fullPath)
      }
    }
    await search(path)
    return results.length > 0 ? results.join('\n') : 'No files found.'
  },
})

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

export const exec = tool({
  description: '执行命令，Windows（powershell），Mac/inux（bash）',
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
    // 1. Read tools.json
    let tools: Record<string, any>
    try {
      tools = await fs.readJson('tools.json')
    }
    catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to read tools.json: ${msg}`)
    }

    // 2. Validate tool existence
    const toolDef = tools[toolid]
    if (!toolDef) {
      const available = Object.keys(tools).join(', ')
      throw new Error(
        `Tool "${toolid}" not found in tools.json.\n`
        + `Available tools: ${available}`,
      )
    }

    // 3. Validate required parameters
    if (toolDef.definition) {
      const missing = Object.entries(toolDef.definition)
        .filter(([key]) => params[key] === undefined || params[key] === '')
        .map(([key, schema]: [string, any]) => `  - ${key}: ${schema.description || schema.type}`)
      if (missing.length > 0) {
        throw new Error(
          `Missing required parameters for tool "${toolid}":\n${missing.join('\n')}\n`
          + `Provided params: ${JSON.stringify(params)}`,
        )
      }
    }

    // 4. Execute the tool
    try {
      const data = await executeCollector(toolDef, params)

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

export const exec_sql = tool({
  description: [
    '在应用内置 SQLite 数据库（main.db）上执行 SQL。数据库已由应用自动管理，无需创建或查找数据库文件。',
    '',
    'Schema:',
    '  record(id TEXT, summary TEXT, data TEXT, createdAt TEXT, updatedAt TEXT, source TEXT, tool TEXT, workspaceId INTEGER)',
    '  report(id INTEGER PK AUTO, name TEXT, type TEXT, content TEXT, createdAt TEXT, updatedAt TEXT, workspaceId INTEGER)',
    '  workspace(id INTEGER PK AUTO, workflow TEXT, name TEXT)',
    '',
    '常见用法: SELECT * FROM record WHERE workspaceId = 1 ORDER BY createdAt DESC LIMIT 10',
  ].join('\n'),
  inputSchema: z.object({
    sql: z.string().describe('要执行的 SQL 语句（SELECT/INSERT/UPDATE/DELETE）'),
  }),
  execute: async ({ sql: sqlString }) => {
    try {
      const result = await sql`${sql.raw(sqlString)}`.execute(db)
      // Convert BigInt values to Number to avoid "Do not know how to serialize a BigInt"
      // when the AI SDK calls JSON.stringify on tool results
      return JSON.parse(JSON.stringify(result, (_key, value) =>
        typeof value === 'bigint' ? Number(value) : value))
    }
    catch (error) {
      console.log(error)
      throw error
    }
  },
})

export const skill = tool({
  description: '加载 workspace/skills 下指定的 Skill，并返回其内容和相关文件列表',
  inputSchema: z.object({
    name: z.string().describe('要加载的 Skill 名称（来自 SKILL.md 的 name 字段）'),
  }),
  execute: async ({ name }) => {
    const skills = await getWorkspaceSkills()
    const skill = skills.find(s => s.name === name)

    if (!skill) {
      const available = skills.map(s => s.name).join(', ')
      throw new Error(`Skill "${name}" 不存在。可用技能: ${available || '无'}`)
    }

    const lastSlash = skill.location.lastIndexOf('/')
    const dir = lastSlash === -1 ? skill.location : skill.location.slice(0, lastSlash)

    const files = await fs.readDir(dir, { recursive: true }).then(entries =>
      entries
        .filter(e => !e.isDirectory && e.name !== 'SKILL.md')
        .slice(0, 10)
        .map(e => `${dir}/${e.name}`),
    )
    return {
      title: `Loaded skill: ${skill.name}`,
      output: [
        `<skill_content name="${skill.name}">`,
        `# Skill: ${skill.name}`,
        '',
        skill.content,
        '',
        `Base directory for this skill: ${dir}`,
        'Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.',
        'Note: file list is sampled.',
        '',
        '<skill_files>',
        ...files.map(file => `<file>${file}</file>`),
        '</skill_files>',
        '</skill_content>',
      ].join('\n'),
      metadata: {
        name: skill.name,
        description: skill.description,
        dir,
      },
    }
  },
})

export const get_records = tool({
  description: '同步数据源并获取数据库中今天的记录',
  inputSchema: z.object({}),
  execute: async () => db.record.findMany({ date: dayjs().toISOString() }),
})

// add_source
// set_source
// get_sources
// get_records
// get_records_by_source
// generate_report
