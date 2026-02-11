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
    const data = await fs.readFile(path)
    return decoder.decode(data)
  },
})

export const write = tool({
  description: '创建或覆盖文件',
  inputSchema: z.object({
    path: z.string(),
    content: z.string(),
  }),
  execute: async ({ path, content }) => {
    await fs.writeFile(path, encoder.encode(content))
    return `Successfully written to ${path}`
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
    const data = await fs.readFile(path)
    const currentText = decoder.decode(data)
    const updatedText = currentText.replace(oldContent, newContent)
    await fs.writeFile(path, encoder.encode(updatedText))
    return `Updated ${path}`
  },
})

export const grep = tool({
  description: '在文件中搜索特定模式',
  inputSchema: z.object({
    path: z.string(),
    pattern: z.string(),
  }),
  execute: async ({ path, pattern }) => {
    const data = await fs.readFile(path)
    const lines = decoder.decode(data).split('\n')
    const matches = lines
      .map((line, index) => line.includes(pattern) ? `${index + 1}: ${line}` : null)
      .filter(Boolean)
    return matches.length > 0 ? matches.join('\n') : 'No matches found.'
  },
})

export const ls = tool({
  description: '列出目录内容',
  inputSchema: z.object({ path: z.string() }),
  execute: async ({ path }) => {
    const entries = await fs.readDir(path)
    return entries.map(e => `${e.isDirectory ? '[DIR]' : '[FILE]'} ${e.name}`).join('\n')
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

export const add_tool = tool({
  description: '添加新的工具用于获取数据源的数据',
  inputSchema: z.object({
    name: z.string(),
    description: z.string(),
    parameterSchema: z.record(z.string(), z.any()),
  }),
  // TODO
  execute: async () => {},
})

export const get_tool = tool({
  description: '获取指定工具的配置',
  inputSchema: z.object({
    toolId: z.string(),
  }),
  execute: async () => {},
})

export const set_tool = tool({
  description: '设置工具的配置',
  inputSchema: z.object({
    toolId: z.string(),
    config: z.record(z.string(), z.any()),
  }),
  execute: async () => {},
})

export const add_source = tool({
  description: '添加新的数据源配置',
  inputSchema: z.object({
    name: z.string(),
    description: z.string(),
    config: z.record(z.string(), z.any()),
  }),

  // TODO
  execute: async () => {},
})

export const set_source = tool({
  description: '设置数据源的配置',
  inputSchema: z.object({
    sourceId: z.string(),
    config: z.record(z.string(), z.any()),
  }),
  execute: async () => {},
})

export const get_records = tool({
  description: '同步并获取所有数据源的数据',
  inputSchema: z.object({
    type: z.enum(['daily', 'weekly', 'monthly']),
  }),
  execute: async () => {},
})

export const get_records_by_source = tool({
  description: '获取指定数据源的数据',
  inputSchema: z.object({
    sourceId: z.string(),
  }),
  execute: async () => {},
})

export const generate_report = tool({
  description: '生成报告',
  inputSchema: z.object({
    type: z.enum(['daily', 'weekly', 'monthly']),
  }),
  execute: async () => {},
})
