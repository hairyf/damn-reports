import type { ColumnType, Generated } from 'kysely'

export type Timestamp = ColumnType<Date, Date | string, Date | string>

export interface Record {
  id: Generated<number>
  summary: string
  data: { [key: string]: any }
  createdAt: Generated<string>
  updatedAt: string
  sourceId: number
  workspaceId: number
}
export interface Report {
  id: Generated<number>
  name: string
  type: string
  content: string
  createdAt: Generated<string>
  updatedAt: string
  workspaceId: number
}
export interface Source {
  id: Generated<number>
  name: string
  type: string
  description: string
  enabled: boolean
  config: { [key: string]: any }
  createdAt: Generated<string>
  updatedAt: string
  workspaceId: number
}
export interface Workspace {
  id: Generated<number>
  workflow: string
  name: string
}
export interface DB {
  record: Record
  report: Report
  source: Source
  workspace: Workspace
}
