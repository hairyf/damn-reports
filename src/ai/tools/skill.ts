import { tool } from 'ai'
import { z } from 'zod'
import * as fs from '@/utils/fs-extra'
import { getSkills } from '@/utils/skills'

export const skill = tool({
  description: '加载指定的 Skill，并返回其内容和相关文件列表',
  inputSchema: z.object({
    name: z.string().describe('要加载的 Skill 名称（来自 SKILL.md 的 name 字段）'),
  }),
  execute: async ({ name }) => {
    const skills = await getSkills()
    const found = skills.find(s => s.name === name)

    if (!found) {
      const available = skills.map(s => s.name).join(', ')
      throw new Error(`Skill "${name}" 不存在。可用技能: ${available || '无'}`)
    }

    const lastSlash = found.location.lastIndexOf('/')
    const dir = lastSlash === -1 ? found.location : found.location.slice(0, lastSlash)

    const files = await fs.readDir(dir, { recursive: true }).then(entries =>
      entries
        .filter(e => !e.isDirectory && !e.name.endsWith('SKILL.md'))
        .slice(0, 10)
        .map(e => e.name),
    )
    return {
      title: `Loaded skill: ${found.name}`,
      output: [
        `<skill_content name="${found.name}">`,
        `# Skill: ${found.name}`,
        '',
        found.content,
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
        name: found.name,
        description: found.description,
        dir,
      },
    }
  },
})
