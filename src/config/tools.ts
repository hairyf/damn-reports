import { tool } from 'ai'
import pathe from 'pathe'
import { z } from 'zod'
import * as fs from '../utils/fs-extra'
// 辅助函数：将 Uint8Array 转为字符串
const decoder = new TextDecoder()
const encoder = new TextEncoder()

export const read = tool({
  description: '读取文件内容',
  inputSchema: z.object({ path: z.string() }),
  execute: async ({ path }) => {
    try {
      path = pathe.join('workspace', path)
      const data = await fs.readFile(path, { baseDir: fs.BaseDirectory.Resource })
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
      path = pathe.join('workspace', path)
      await fs.writeFile(path, encoder.encode(content), { baseDir: fs.BaseDirectory.Resource })
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
      path = pathe.join('workspace', path)
      const data = await fs.readFile(path, { baseDir: fs.BaseDirectory.Resource })
      const currentText = decoder.decode(data)
      const updatedText = currentText.replace(oldContent, newContent)
      await fs.writeFile(path, encoder.encode(updatedText), { baseDir: fs.BaseDirectory.AppData })
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
      const data = await fs.readFile(path, { baseDir: fs.BaseDirectory.Resource })
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
      path = pathe.join('workspace', path)
      const entries = await fs.readDir(path, { baseDir: fs.BaseDirectory.Resource })
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
    path = pathe.join('workspace', path)
    async function search(dir: string) {
      const entries = await fs.readDir(dir, { baseDir: fs.BaseDirectory.Resource })
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

export const exec = tool({
  description: '执行命令',
  inputSchema: z.object({
    command: z.string().describe('要执行的命令'),
  }),
  execute: async ({ command }) => executeCommand(command),
})

export const get_tools = tool({
  description: '获取所有工具（收集器）的配置',
  inputSchema: z.object({}),
  execute: async () => fs.readJson('tools.json'),
})

export const add_tool = tool({
  description: '添加新的工具用于获取数据源的数据',
  inputSchema: z.object({
    name: z.string().describe('工具名称'),
    description: z.string().describe('工具描述'),
    definition: z.record(z.string(), z.any()).describe('工具定义'),
    files: z.array(z.string()).describe('工具文件').optional(),
    type: z.enum(['exec', 'http']).describe('工具类型'),
    executor: z.record(z.string(), z.any()).describe('工具执行器（Mustache、JSONata 表达式）'),
    transformer: z.string().describe('工具转换器，必须返回该格式 { summary: string, createdAt: number, data: any } 的对象或数组，使用 JSONata 表达式。'),
  }),
  execute: async ({ name, description, definition, files, type, executor, transformer }) => {
    const tools = await fs.readJson('tools.json')
    tools[name] = { name, description, definition, files, type, executor, transformer }
    await fs.writeJson('tools.json', tools)
    return `Tool ${name} added successfully`
  },
})

export const get_tool = tool({
  description: '获取指定工具的配置',
  inputSchema: z.object({
    tool: z.string(),
  }),
  execute: async ({ tool }) => {
    const tools = await fs.readJson('tools.json')
    return tools[tool]
  },
})

export const set_tool = tool({
  description: '设置工具的配置',
  inputSchema: z.object({
    tool: z.string(),
    description: z.string(),
    definition: z.record(z.string(), z.any()),
    files: z.array(z.string()).optional(),
    type: z.enum(['exec', 'http']),
    executor: z.record(z.string(), z.any()),
    transformer: z.string(),
  }),
  execute: async ({ tool, description, definition, files, type, executor, transformer }) => {
    const tools = await fs.readJson('tools.json')
    tools[tool].description = description
    tools[tool].definition = definition
    tools[tool].files = files
    tools[tool].type = type
    tools[tool].executor = executor
    tools[tool].transformer = transformer
    await fs.writeJson('tools.json', tools)
    return `Tool ${tool} updated successfully`
  },
})

export const exe_tool = tool({
  description: '执行指定的工具',
  inputSchema: z.object({
    tool: z.string().describe('要执行的工具 ID'),
    params: z.record(z.string(), z.any()).describe('工具参数').optional(),
  }),
  execute: async ({ tool, params = {} }) => {
    const tools = await fs.readJson('tools.json')
    const data = await executeCollector(tools[tool], params)
    // eslint-disable-next-line no-console
    console.log('Tool execution result:', data)
    return data
  },
})

// add_source
// set_source
// get_sources
// get_records
// get_records_by_source
// generate_report
