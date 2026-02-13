/* eslint-disable no-console */
import type { ExecuteResult, ExecutorDeps } from './executor'
import type { CronEvent, CronJob, CronJobCreate, CronJobPatch, CronStoreFile } from './types'
import { executeJob } from './executor'
import { computeNextRunAtMs } from './schedule'

const MAX_TIMER_DELAY_MS = 60_000
const DEFAULT_JOB_TIMEOUT_MS = 10 * 60_000

const ERROR_BACKOFF_MS = [
  30_000, // 1st error  →  30s
  60_000, // 2nd error  →  1min
  5 * 60_000, // 3rd error  →  5min
  15 * 60_000, // 4th error  → 15min
  60 * 60_000, // 5th+ error → 60min
]

function errorBackoffMs(consecutiveErrors: number): number {
  const idx = Math.min(consecutiveErrors - 1, ERROR_BACKOFF_MS.length - 1)
  return ERROR_BACKOFF_MS[Math.max(0, idx)]
}

export interface CronServiceOptions {
  load: () => Promise<CronStoreFile>
  save: (store: CronStoreFile) => Promise<void>
  deps: ExecutorDeps
  onEvent?: (evt: CronEvent) => void
}

export class CronService {
  private store: CronStoreFile | null = null
  private timer: ReturnType<typeof setTimeout> | null = null
  private running = false
  private opts: CronServiceOptions

  constructor(opts: CronServiceOptions) {
    this.opts = opts
  }

  async start() {
    this.store = await this.opts.load()
    this.recomputeNextRuns()
    await this.opts.save(this.store)
    this.armTimer()
    console.info('[cron] service started', { jobs: this.store.jobs.length })
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    console.info('[cron] service stopped')
  }

  // ── CRUD ──

  async reload() {
    this.store = await this.opts.load()
    this.recomputeNextRuns()
    await this.opts.save(this.store)
    this.armTimer()
  }

  async list(): Promise<CronJob[]> {
    await this.ensureLoaded()
    return [...this.store!.jobs]
  }

  async add(input: CronJobCreate): Promise<CronJob> {
    await this.ensureLoaded()
    const now = Date.now()
    const job: CronJob = {
      ...input,
      id: `cron_${now}_${crypto.randomUUID().slice(0, 8)}`,
      state: { ...input.state },
      createdAtMs: now,
      updatedAtMs: now,
    }
    if (job.enabled) {
      job.state.nextRunAtMs = computeNextRunAtMs(job.schedule, now)
    }
    this.store!.jobs.push(job)
    await this.opts.save(this.store!)
    this.emit({ jobId: job.id, action: 'added', nextRunAtMs: job.state.nextRunAtMs })
    this.armTimer()
    return job
  }

  async update(id: string, patch: CronJobPatch): Promise<CronJob | null> {
    await this.ensureLoaded()
    const job = this.store!.jobs.find(j => j.id === id)
    if (!job)
      return null

    const now = Date.now()
    if (patch.name !== undefined)
      job.name = patch.name
    if (patch.description !== undefined)
      job.description = patch.description
    if (patch.enabled !== undefined)
      job.enabled = patch.enabled
    if (patch.deleteAfterRun !== undefined)
      job.deleteAfterRun = patch.deleteAfterRun
    if (patch.schedule)
      job.schedule = patch.schedule
    if (patch.payload)
      job.payload = patch.payload
    if (patch.state)
      Object.assign(job.state, patch.state)
    job.updatedAtMs = now

    if (job.enabled) {
      job.state.nextRunAtMs = computeNextRunAtMs(job.schedule, now)
    }
    else {
      job.state.nextRunAtMs = undefined
    }

    await this.opts.save(this.store!)
    this.emit({ jobId: job.id, action: 'updated', nextRunAtMs: job.state.nextRunAtMs })
    this.armTimer()
    return job
  }

  async remove(id: string): Promise<boolean> {
    await this.ensureLoaded()
    const before = this.store!.jobs.length
    this.store!.jobs = this.store!.jobs.filter(j => j.id !== id)
    if (this.store!.jobs.length === before)
      return false
    await this.opts.save(this.store!)
    this.emit({ jobId: id, action: 'removed' })
    this.armTimer()
    return true
  }

  async run(id: string): Promise<ExecuteResult> {
    await this.ensureLoaded()
    const job = this.store!.jobs.find(j => j.id === id)
    if (!job)
      return { status: 'error', error: 'job not found' }
    return this.executeAndApply(job)
  }

  // ── Internal ──

  private async ensureLoaded() {
    if (!this.store) {
      this.store = await this.opts.load()
    }
  }

  private recomputeNextRuns() {
    if (!this.store)
      return
    const now = Date.now()
    for (const job of this.store.jobs) {
      if (!job.state)
        job.state = {}
      if (job.enabled && typeof job.state.runningAtMs !== 'number') {
        job.state.nextRunAtMs = computeNextRunAtMs(job.schedule, now)
      }
      else if (!job.enabled) {
        job.state.nextRunAtMs = undefined
      }
    }
  }

  private nextWakeAtMs(): number | null {
    if (!this.store)
      return null
    let earliest: number | null = null
    for (const job of this.store.jobs) {
      if (job.enabled && typeof job.state.nextRunAtMs === 'number') {
        if (earliest === null || job.state.nextRunAtMs < earliest)
          earliest = job.state.nextRunAtMs
      }
    }
    return earliest
  }

  private armTimer() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    const nextAt = this.nextWakeAtMs()
    if (!nextAt)
      return

    const delay = Math.max(nextAt - Date.now(), 0)
    const clampedDelay = Math.min(delay, MAX_TIMER_DELAY_MS)

    this.timer = setTimeout(() => this.onTimer(), clampedDelay)
  }

  private async onTimer() {
    if (this.running) {
      // Re-arm to avoid stalling
      this.timer = setTimeout(() => this.onTimer(), MAX_TIMER_DELAY_MS)
      return
    }
    this.running = true
    try {
      await this.ensureLoaded()
      const dueJobs = this.findDueJobs()

      for (const job of dueJobs) {
        await this.executeAndApply(job)
      }

      if (dueJobs.length === 0) {
        // Maintenance recompute
        this.recomputeNextRuns()
        await this.opts.save(this.store!)
      }
    }
    catch (err) {
      console.error('[cron] timer tick failed:', err)
    }
    finally {
      this.running = false
      this.armTimer()
    }
  }

  private findDueJobs(): CronJob[] {
    if (!this.store)
      return []
    const now = Date.now()
    return this.store.jobs.filter((j) => {
      if (!j.state)
        j.state = {}
      if (!j.enabled)
        return false
      if (typeof j.state.runningAtMs === 'number')
        return false
      const next = j.state.nextRunAtMs
      return typeof next === 'number' && now >= next
    })
  }

  private async executeAndApply(job: CronJob): Promise<ExecuteResult> {
    const startedAt = Date.now()
    job.state.runningAtMs = startedAt
    job.state.lastError = undefined
    this.emit({ jobId: job.id, action: 'started' })

    let result: ExecuteResult
    try {
      result = await Promise.race([
        executeJob(job, this.opts.deps),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('job execution timed out')), DEFAULT_JOB_TIMEOUT_MS)
        }),
      ])
    }
    catch (err) {
      result = { status: 'error', error: String(err) }
    }

    const endedAt = Date.now()
    this.applyResult(job, result, startedAt, endedAt)
    await this.opts.save(this.store!)

    this.emit({
      jobId: job.id,
      action: 'finished',
      status: result.status,
      error: result.error,
      nextRunAtMs: job.state.nextRunAtMs,
    })

    return result
  }

  private applyResult(job: CronJob, result: ExecuteResult, startedAt: number, endedAt: number) {
    job.state.runningAtMs = undefined
    job.state.lastRunAtMs = startedAt
    job.state.lastStatus = result.status
    job.state.lastDurationMs = Math.max(0, endedAt - startedAt)
    job.state.lastError = result.error
    job.updatedAtMs = endedAt

    if (result.status === 'error') {
      job.state.consecutiveErrors = (job.state.consecutiveErrors ?? 0) + 1
    }
    else {
      job.state.consecutiveErrors = 0
    }

    const shouldDelete = job.schedule.kind === 'at' && job.deleteAfterRun && result.status === 'ok'

    if (shouldDelete) {
      this.store!.jobs = this.store!.jobs.filter(j => j.id !== job.id)
      this.emit({ jobId: job.id, action: 'removed' })
      return
    }

    if (job.schedule.kind === 'at') {
      // One-shot: disable after any terminal status
      job.enabled = false
      job.state.nextRunAtMs = undefined
    }
    else if (result.status === 'error' && job.enabled) {
      // Exponential backoff
      const backoff = errorBackoffMs(job.state.consecutiveErrors ?? 1)
      const normalNext = computeNextRunAtMs(job.schedule, endedAt)
      const backoffNext = endedAt + backoff
      job.state.nextRunAtMs = normalNext !== undefined ? Math.max(normalNext, backoffNext) : backoffNext
    }
    else if (job.enabled) {
      job.state.nextRunAtMs = computeNextRunAtMs(job.schedule, endedAt)
    }
    else {
      job.state.nextRunAtMs = undefined
    }
  }

  private emit(evt: CronEvent) {
    try {
      this.opts.onEvent?.(evt)
    }
    catch { /* ignore */ }
  }
}
