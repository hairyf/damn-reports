// ── helpers ──

export interface ToolRecord {
  id: string
  summary: string
  createdAt: number
  data: Record<string, any>
}

export function normalizeToolOutput(output: any): ToolRecord[] {
  if (Array.isArray(output)) {
    return output.filter(Boolean).map((item: any) => ({
      id: String(item?.id ?? crypto.randomUUID()),
      summary: String(item?.summary ?? ''),
      createdAt: typeof item?.createdAt === 'number' ? item.createdAt : Date.now(),
      data: item?.data && typeof item.data === 'object' ? item.data : {},
    }))
  }
  if (output && typeof output === 'object') {
    return [{
      id: String(output.id ?? crypto.randomUUID()),
      summary: String(output.summary ?? ''),
      createdAt: typeof output.createdAt === 'number' ? output.createdAt : Date.now(),
      data: output.data && typeof output.data === 'object' ? output.data : {},
    }]
  }
  return []
}
