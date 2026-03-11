// ── Schedule ──

export type CronSchedule
  = | { kind: 'at', at: string }
    | { kind: 'every', everyMs: number, anchorMs?: number }
    | { kind: 'cron', expr: string, tz?: string }
    | { kind: 'workday', time: string, region?: string }
    | { kind: 'reportend', trigger: 'every' | 'scheduled' }

// ── Payload ──

export type CronPayload
  = | { kind: 'collect' }
    | { kind: 'report' }
    | { kind: 'mainagent', message: string }
    | { kind: 'command', command: string }

// ── Job State ──

export interface CronJobState {
  nextRunAtMs?: number
  runningAtMs?: number
  lastRunAtMs?: number
  lastStatus?: 'ok' | 'error' | 'skipped'
  lastError?: string
  lastDurationMs?: number
  consecutiveErrors?: number
}

// ── Job ──

export interface CronJob {
  id: string
  name: string
  description?: string
  enabled: boolean
  deleteAfterRun?: boolean
  /** 系统任务，不允许删除 */
  system?: boolean
  /** 是否在前端显示，false 则仅在内部使用 */
  view?: boolean
  /** 导出/导入时携带的附件路径（相对工作区），如 reportend 的脚本 */
  files?: readonly string[]
  /** npm 依赖，与 package.json dependencies 格式一致，导入后会在工作区自动安装 */
  dependencies?: Record<string, string>
  schedule: CronSchedule
  payload: CronPayload
  state: CronJobState
  createdAtMs: number
  updatedAtMs: number
}

// ── Store File ──

export interface CronStoreFile {
  version: 1
  jobs: CronJob[]
}

// ── CRUD Types ──

export type CronJobCreate = Omit<CronJob, 'id' | 'createdAtMs' | 'updatedAtMs' | 'state'> & {
  state?: Partial<CronJobState>
}

export type CronJobPatch = Partial<Omit<CronJob, 'id' | 'createdAtMs' | 'state'>> & {
  payload?: CronPayload
  state?: Partial<CronJobState>
}

// ── Events ──

export interface CronEvent {
  jobId: string
  action: 'added' | 'updated' | 'removed' | 'started' | 'finished'
  status?: 'ok' | 'error' | 'skipped'
  error?: string
  nextRunAtMs?: number
}
