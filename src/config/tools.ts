import * as fs from '@tauri-apps/plugin-fs'
import { tool } from 'ai'
import { z } from 'zod'

// 辅助函数：将 Uint8Array 转为字符串
const decoder = new TextDecoder()
const encoder = new TextEncoder()

export const read = tool({
  description: '读取文件内容',
  inputSchema: z.object({ path: z.string() }),
  execute: async ({ path }) => {
    try {
      const data = await fs.readFile(path, { baseDir: fs.BaseDirectory.AppData })
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
      await fs.writeFile(path, encoder.encode(content), { baseDir: fs.BaseDirectory.AppData })
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
      const data = await fs.readFile(path, { baseDir: fs.BaseDirectory.AppData })
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
      const data = await fs.readFile(path, { baseDir: fs.BaseDirectory.AppData })
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
      const entries = await fs.readDir(path, { baseDir: fs.BaseDirectory.AppData })
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
      const entries = await fs.readDir(dir, { baseDir: fs.BaseDirectory.AppData })
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

export const add_tool = tool({
  description: '添加新的工具用于获取数据源的数据',
  inputSchema: z.object({
    name: z.string(),
    description: z.string(),
    parameterSchema: z.record(z.string(), z.any()),
  }),
  // TODO
  execute: async () => 'TODO',
})

export const get_tool = tool({
  description: '获取指定工具的配置',
  inputSchema: z.object({
    toolId: z.string(),
  }),
  execute: async () => 'TODO',
})

export const set_tool = tool({
  description: '设置工具的配置',
  inputSchema: z.object({
    toolId: z.string(),
    config: z.record(z.string(), z.any()),
  }),
  execute: async () => 'TODO',
})

export const add_source = tool({
  description: '添加新的数据源配置',
  inputSchema: z.object({
    name: z.string(),
    description: z.string(),
    config: z.record(z.string(), z.any()),
  }),

  // TODO
  execute: async () => 'TODO',
})

export const set_source = tool({
  description: '设置数据源的配置',
  inputSchema: z.object({
    sourceId: z.string(),
    config: z.record(z.string(), z.any()),
  }),
  execute: async () => 'TODO',
})

export const get_sources = tool({
  description: '获取所有数据源的配置',
  inputSchema: z.object(),
  execute: async () => db.source.findMany({}),
})

export const get_records = tool({
  description: '同步并获取所有数据源的数据',
  inputSchema: z.object({
    type: z.enum(['daily', 'weekly', 'monthly']),
  }),
  execute: async () => 'TODO',
})

export const get_records_by_source = tool({
  description: '获取指定数据源的数据',
  inputSchema: z.object({
    sourceId: z.string(),
  }),
  execute: async () => 'TODO',
})

export const generate_report = tool({
  description: '生成报告',
  inputSchema: z.object({
    type: z.enum(['daily', 'weekly', 'monthly']),
  }),
  execute: async () => 'TODO',
})
