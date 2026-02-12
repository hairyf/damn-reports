import * as fs from '@/utils/fs-extra'

const SOURCES_PATH = 'sources.json'

export interface SourceJson {
  id: string
  name: string
  tool: string
  config: Record<string, any>
  createAt: string
  updateAt: string
}

async function readSourcesRaw(): Promise<SourceJson[]> {
  try {
    const data = await fs.readJson(SOURCES_PATH)
    return Array.isArray(data) ? data : []
  }
  catch {
    return []
  }
}

export async function getSources(): Promise<SourceJson[]> {
  return readSourcesRaw()
}

export async function getSourceById(id: string): Promise<SourceJson | null> {
  const sources = await readSourcesRaw()
  return sources.find(s => s.id === id) ?? null
}

export async function saveSources(sources: SourceJson[]): Promise<void> {
  await fs.writeJson(SOURCES_PATH, sources)
}

export async function createSource(
  input: Omit<SourceJson, 'id' | 'createAt' | 'updateAt'>,
): Promise<SourceJson> {
  const sources = await readSourcesRaw()
  const now = new Date().toISOString()
  const id = `source_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
  const source: SourceJson = {
    ...input,
    id,
    createAt: now,
    updateAt: now,
  }
  sources.push(source)
  await saveSources(sources)
  return source
}

export async function updateSource(
  id: string,
  input: Partial<Omit<SourceJson, 'id' | 'createAt'>>,
): Promise<SourceJson | null> {
  const sources = await readSourcesRaw()
  const index = sources.findIndex(s => s.id === id)
  if (index === -1)
    return null

  const updated: SourceJson = {
    ...sources[index],
    ...input,
    updateAt: new Date().toISOString(),
  }
  sources[index] = updated
  await saveSources(sources)
  return updated
}

export async function deleteSource(id: string): Promise<boolean> {
  const sources = await readSourcesRaw()
  const filtered = sources.filter(s => s.id !== id)
  if (filtered.length === sources.length)
    return false

  await saveSources(filtered)
  return true
}
