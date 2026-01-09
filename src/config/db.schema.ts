import type { ColumnType } from 'kysely'

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>
export type Timestamp = ColumnType<Date, Date | string, Date | string>

export interface Record {
  id: string
  summary: string
  data: { [key: string]: any }
  source: string
  createdAt: Generated<string>
  updatedAt: string
}
export interface Report {
  id: string
  name: string
  type: string
  content: string
  createdAt: Generated<string>
  updatedAt: string
}
export interface Source {
  id: string
  name: string
  type: string
  description: string
  enabled: boolean
  config: { [key: string]: any }
  createdAt: Generated<string>
  updatedAt: string
}
export interface sqlite_master {
  type: string
  name: string
  tbl_name: string
  rootpage: number
  sql: string | null
}
export interface DB {
  Record: Record
  Report: Report
  Source: Source
  sqlite_master: sqlite_master
}
