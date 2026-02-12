import { tool } from 'ai'
import matter from 'gray-matter'
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
    const tools = await fs.readJson('tools.json')
    const data = await executeCollector(tools[toolid], params)
    // eslint-disable-next-line no-console
    console.log('Tool execution result:', data)
    return data
  },
})

interface WorkspaceSkill {
  name: string
  description: string
  location: string
  content: string
}

async function loadWorkspaceSkills(): Promise<WorkspaceSkill[]> {
  const skills: WorkspaceSkill[] = []

  async function scan(relativeDir: string) {
    const entries = await fs.readDir(relativeDir)
    for (const entry of entries) {
      const childRelative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name
      if (entry.isDirectory) {
        await scan(childRelative)
      }
      else if (entry.name === 'SKILL.md') {
        const data = await fs.readFile(childRelative)
        const text = decoder.decode(data)
        const skill = parseSkillFromMarkdown(text, childRelative)
        if (skill)
          skills.push(skill)
      }
    }
  }

  // skills 目录位于 workspace 根目录下，location 基于 workspace 相对路径（例如 skills/tool/SKILL.md）
  await scan('skills')
  return skills
}

function parseSkillFromMarkdown(markdown: string, location: string): WorkspaceSkill | null {
  const { data, content } = matter(markdown)
  const frontmatter = data as { name?: string, description?: string }
  if (!frontmatter.name)
    return null

  return {
    name: String(frontmatter.name),
    description: frontmatter.description ? String(frontmatter.description) : '',
    location,
    content: content.trim(),
  }
}

export const skill = tool({
  description: '加载 workspace/skills 下指定的 Skill，并返回其内容和相关文件列表',
  inputSchema: z.object({
    name: z.string().describe('要加载的 Skill 名称（来自 SKILL.md 的 name 字段）'),
  }),
  execute: async ({ name }) => {
    const skills = await loadWorkspaceSkills()
    const skill = skills.find(s => s.name === name)

    if (!skill) {
      const available = skills.map(s => s.name).join(', ')
      throw new Error(`Skill "${name}" 不存在。可用技能: ${available || '无'}`)
    }

    const lastSlash = skill.location.lastIndexOf('/')
    const dir = lastSlash === -1 ? skill.location : skill.location.slice(0, lastSlash)

    let files: string[] = []
    const entries = await fs.readDir(dir)
    files = entries
      .filter(e => !e.isDirectory && e.name !== 'SKILL.md')
      .slice(0, 10)
      .map(e => `${dir}/${e.name}`)

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

// add_source
// set_source
// get_sources
// get_records
// get_records_by_source
// generate_report
