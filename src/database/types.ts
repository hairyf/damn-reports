import type { ColumnType } from 'kysely'

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>
export type Timestamp = ColumnType<Date, Date | string, Date | string>

export interface Record {
  id: string
  summary: string
  data: any
  createdAt: Generated<number> // INTEGER 时间戳（秒）
  updatedAt: number // INTEGER 时间戳（秒）
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
  config: any
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
