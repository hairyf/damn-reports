import matter from 'front-matter'

export interface Skill {
  name: string
  description: string
  location: string
  content: string
}

export async function getWorkspaceSkills() {
  const skills: Skill[] = []

  async function scan(relativeDir: string) {
    const entries = await readDir(relativeDir)
    for (const entry of entries) {
      const childRelative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name
      if (entry.isDirectory) {
        await scan(childRelative)
      }
      else if (entry.name === 'SKILL.md') {
        const data = await readTextFile(childRelative)
        const skill = parseSkill(data, childRelative)
        if (skill)
          skills.push(skill)
      }
    }
  }

  // skills 目录位于 workspace 根目录下，location 基于 workspace 相对路径（例如 skills/tool/SKILL.md）
  await scan('skills')
  return skills
}

export function parseSkill(markdown: string, location: string): Skill | null {
  const { attributes: data, body: content } = matter<{ name?: string, description?: string }>(markdown)
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
