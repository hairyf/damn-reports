/* eslint-disable no-console */
import type { Collector } from '@/utils/exec'
import { cloneDeep } from '@hairy/utils'
import { defineStore } from 'valtio-define'
import { store } from '@/store'
import { executeCollector } from '@/utils/exec'
import { normalizeToolOutput } from './utils'

export interface Source {
  id: string
  name: string
  description: string
  tool: string
  enable?: boolean
  params: Record<string, any>
  createdAt: string
  updatedAt: string
}

export const source = defineStore({
  state: () => ({
    raw: [] as Source[],
  }),
  getters: {
    map(): Map<string, { name: string, tool: string }> {
      const m = new Map<string, { name: string, tool: string }>()
      for (const s of this.raw)
        m.set(s.id, { name: s.name, tool: s.tool })
      return m
    },
  },
  actions: {
    async sync() {
      const data = await readJson('source.json').catch(() => [])
      const arr = Array.isArray(data) ? data : []
      const now = new Date().toISOString()
      this.raw = arr.map((item: any) => {
        const id = item?.id ?? `source_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
        const createdAt = item?.createdAt ?? now
        const updatedAt = item?.updatedAt ?? now
        const enable = item?.enable ?? true
        return { ...item, id, createdAt, updatedAt, enable }
      })
      if (arr.some((item: any) => !item?.id || !item?.createdAt || !item?.updatedAt))
        await this.save()
    },

    async save() {
      await writeJson('source.json', this.raw)
    },

    find(id: string): Source | undefined {
      return this.raw.find(s => s.id === id)
    },

    async create(input: Omit<Source, 'id' | 'createdAt' | 'updatedAt'>): Promise<Source> {
      const now = new Date().toISOString()
      const id = `source_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
      const item: Source = { ...input, enable: input.enable ?? true, id, createdAt: now, updatedAt: now }
      this.raw.push(item)
      await this.save()
      return item
    },

    async update(id: string, input: Partial<Omit<Source, 'id' | 'createdAt'>>): Promise<Source | null> {
      const index = this.raw.findIndex(s => s.id === id)
      if (index === -1)
        return null
      const updated: Source = { ...this.raw[index], ...input, updatedAt: new Date().toISOString() }
      this.raw[index] = updated
      await this.save()
      return updated
    },

    async remove(id: string): Promise<boolean> {
      const before = this.raw.length
      this.raw = this.raw.filter(s => s.id !== id)
      if (this.raw.length === before)
        return false
      await this.save()
      return true
    },

    async collect(): Promise<number> {
      const tools = cloneDeep(store.tool.raw)
      const sources = cloneDeep(this.raw)

      if (sources.length === 0)
        return 0

      const allRecords: Array<{
        id: string
        summary: string
        data: any
        createdAt: string
        updatedAt: string
        source: string
        tool: string
      }> = []

      for (const src of sources) {
        if (src.enable === false) {
          console.info(`Source "${src.name}" is disabled, skipping`)
          continue
        }

        const sourceId = src.id ?? ''
        if (!sourceId) {
          console.warn(`Source "${src.name}" has no id, skipping`)
          continue
        }

        const toolDef = tools[src.tool]
        if (!toolDef) {
          console.warn(`Tool "${src.tool}" not found in tool.json, skipping source "${src.name}"`)
          continue
        }

        try {
          const output = await executeCollector(toolDef as Collector, src.params)
          const records = normalizeToolOutput(output)

          for (const r of records) {
            const tsMs = r.createdAt >= 1e12 ? r.createdAt : r.createdAt * 1000
            const iso = new Date(tsMs).toISOString()
            allRecords.push({
              id: r.id,
              summary: r.summary,
              data: r.data,
              createdAt: iso,
              updatedAt: iso,
              source: sourceId,
              tool: src.tool ?? '',
            })
          }
        }
        catch (err) {
          console.error(`Failed to collect from source "${src.name}" (${src.tool}):`, err)
        }
      }

      if (allRecords.length === 0)
        return 0

      const ids = allRecords.map(r => r.id)
      const existingRows = ids.length > 0
        ? await db.selectFrom('record').select('id').where('id', 'in', ids).execute()
        : []
      const existingIds = new Set(existingRows.map(r => r.id))
      const newRecords = allRecords.filter(r => !existingIds.has(r.id))

      if (newRecords.length > 0)
        await db.record.createMany(newRecords)

      return newRecords.length
    },
  },
})

source.sync()
