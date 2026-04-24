import matter from 'front-matter'

interface SkillFrontmatter {
  name: string
  description?: string
}

export interface Skill extends SkillFrontmatter {
  location: string
  content: string
}

export async function getSkills(baseDir = 'skills'): Promise<Skill[]> {
  const entries = await readDir(baseDir)

  const tasks = entries.map(async (entry) => {
    const fullPath = `${baseDir}/${entry.name}`

    if (entry.isDirectory)
      return getSkills(fullPath)

    if (entry.name === 'SKILL.md') {
      const rawData = await readTextFile(fullPath)
      const skill = parseSkill(rawData, fullPath)
      return skill ? [skill] : []
    }

    return []
  })

  const results = await Promise.all(tasks)
  return results.flat()
}

export function parseSkill(markdown: string, location: string): Skill | null {
  const { attributes, body } = matter<SkillFrontmatter>(markdown)

  if (!attributes?.name)
    return null

  return {
    name: String(attributes.name),
    description: attributes.description ? String(attributes.description) : '',
    content: body.trim(),
    location,
  }
}
