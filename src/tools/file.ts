import { tool } from 'ai'
import { z } from 'zod'
import { store } from '@/store'
import * as fs from '@/utils/fs-extra'
import { applyPatch } from '../utils/apply-patch'

const decoder = new TextDecoder()
const encoder = new TextEncoder()
const normalizeLn = (s: string) => s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

/** 文件修改后同步 store */
function syncStoreAfterWrite() {
  store.tool.sync()
  store.source.sync()
  store.cron.sync()
}

export const read = tool({
  description: '读取文件内容',
  inputSchema: z.object({
    path: z.string().describe('文件路径'),
  }),
  execute: async ({ path }) => {
    const data = await fs.readFile(path)
    return decoder.decode(data)
  },
})

export const write = tool({
  description: '创建或覆盖文件',
  inputSchema: z.object({
    path: z.string().describe('文件路径'),
    content: z.string().describe('文件内容'),
  }),
  execute: async ({ path, content }) => {
    await fs.writeFile(path, encoder.encode(content))
    syncStoreAfterWrite()
    return `Successfully written to ${path}`
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
    const currentText = await fs.readTextFile(path)
    const normCurrent = normalizeLn(currentText)
    const normOld = normalizeLn(oldContent)
    if (!normCurrent.includes(normOld)) {
      const snippet = currentText.slice(0, 200).replace(/\n/g, '↵')
      throw new Error(
        `oldContent 在文件中未找到。请用 read 重新读取文件，复制确切的原文。文件开头片段: "${snippet}..."`,
      )
    }
    const updatedText = normCurrent.replace(normOld, newContent)
    await fs.writeTextFile(path, updatedText)
    syncStoreAfterWrite()
    return `Updated ${path}`
  },
})

export const apply_patch = tool({
  description: [
    '按 apply_patch 格式应用多文件补丁。输入须包含 *** Begin Patch 和 *** End Patch 标记。',
    '',
    '支持的 hunk：',
    '- *** Add File: path - 新建文件',
    '- *** Delete File: path - 删除文件',
    '- *** Update File: path - 更新文件（可选 *** Move to: newPath 重命名）',
    '',
    'Update 行内格式：空格=上下文，-=删除行，+=新增行。可用 @@ 或空行开始首个 chunk。*** End of File 表示在文件末尾插入。',
  ].join('\n'),
  inputSchema: z.object({
    input: z.string().describe('补丁内容（*** Begin Patch ... *** End Patch 格式）'),
  }),
  execute: async ({ input }) => {
    if (!input?.trim())
      throw new Error('Provide a patch input.')
    const result = await applyPatch(input)
    syncStoreAfterWrite()
    return result.text
  },
})

export const grep = tool({
  description: [
    '在文件或目录中搜索模式。path 可为单文件或目录（递归）。',
    '',
    '- pattern 支持正则；若 literal 为 true 则按字面量匹配',
    '- ignoreCase: 忽略大小写',
    '- context: 匹配行前后行数',
    '- limit: 最大匹配数（默认 100）',
    '- glob: 文件过滤，如 *.ts、*.md',
  ].join('\n'),
  inputSchema: z.object({
    path: z.string().describe('文件或目录路径（空或 . 表示 workspace 根）'),
    pattern: z.string().describe('搜索模式（正则或字面量）'),
    literal: z.boolean().describe('按字面量匹配（不解析正则）').optional(),
    ignoreCase: z.boolean().describe('忽略大小写').optional(),
    context: z.number().describe('匹配行前后行数').optional(),
    limit: z.number().describe('最大匹配数').optional(),
    glob: z.string().describe('文件过滤如 *.ts').optional(),
  }),
  execute: async ({ path, pattern, literal, ignoreCase, context, limit, glob }) => {
    return fs.grep(path || '.', pattern, {
      literal,
      ignoreCase,
      context,
      limit,
      glob,
    })
  },
})

export const ls = tool({
  description: '列出目录内容',
  inputSchema: z.object({
    path: z.string().describe('目录路径'),
  }),
  execute: async ({ path }) => {
    const entries = await fs.readDir(path)
    return entries.map(e => `${e.isDirectory ? '[DIR]' : '[FILE]'} ${e.name}`).join('\n')
  },
})

export const find = tool({
  description: '递归查找包含特定字符串的文件名',
  inputSchema: z.object({
    path: z.string().describe('起始目录路径'),
    query: z.string().describe('文件名需包含的字符串'),
  }),
  execute: async ({ path, query }) => {
    const results: string[] = []
    async function search(dir: string) {
      const entries = await fs.readDir(dir || '.')
      for (const entry of entries) {
        const fullPath = dir ? `${dir}/${entry.name}` : entry.name
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
