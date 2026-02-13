// ── Schedule ──

export type CronSchedule =
  | { kind: 'at'; at: string }
  | { kind: 'every'; everyMs: number; anchorMs?: number }
  | { kind: 'cron'; expr: string; tz?: string }

// ── Payload ──

export type CronPayload =
  | { kind: 'collect' }
  | { kind: 'report' }
  | { kind: 'agentTurn'; message: string }
  | { kind: 'command'; command: string }

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
