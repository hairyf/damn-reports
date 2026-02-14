import { tool } from 'ai'
import { z } from 'zod'
import { store } from '@/store'
import * as fs from '@/utils/fs-extra'

const decoder = new TextDecoder()
const encoder = new TextEncoder()
const normalizeLn = (s: string) => s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

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
      store.tool.sync()
      store.source.sync()
      store.cron.sync()
      return `Successfully written to ${path}`
    }
    catch (error) {
      console.error(error)
      throw error
    }
  },
})

export const edit = tool({
  description: [
    '对文件进行精确文本替换。oldContent 必须与文件中内容完全一致（空格、缩进、转义）。换行符 CRLF/LF 会自动规范化。',
    '',
    '使用前：先用 read 读取文件，从返回值中复制要替换的原文作为 oldContent，确保一字不差。',
    '建议：替换范围尽量小（几行即可），大段修改或 JSON 结构变更优先用 write 重写整个文件。',
    '若 oldContent 未找到，会抛出错误并返回文件片段以便排查。',
  ].join('\n'),
  inputSchema: z.object({
    path: z.string().describe('文件路径'),
    oldContent: z.string().describe('要被替换的原文，必须与 read 读到的内容完全一致，含空格/换行/缩进'),
    newContent: z.string().describe('替换后的新文本'),
  }),
  execute: async ({ path, oldContent, newContent }) => {
    try {
      const data = await fs.readFile(path)
      const currentText = decoder.decode(data)
      const normCurrent = normalizeLn(currentText)
      const normOld = normalizeLn(oldContent)
      if (!normCurrent.includes(normOld)) {
        const snippet = currentText.slice(0, 200).replace(/\n/g, '↵')
        throw new Error(
          `oldContent 在文件中未找到。请用 read 重新读取文件，复制确切的原文。文件开头片段: "${snippet}..."`,
        )
      }
      const updatedText = normCurrent.replace(normOld, newContent)
      await fs.writeFile(path, encoder.encode(updatedText))
      store.tool.sync()
      store.source.sync()
      store.cron.sync()
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
