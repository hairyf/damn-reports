import type { CronSchedule } from './types'
import { Cron } from 'croner'
import { computeNextWorkdayRunAtMs } from './workday'

function resolveCronTimezone(tz?: string) {
  const trimmed = typeof tz === 'string' ? tz.trim() : ''
  return trimmed || Intl.DateTimeFormat().resolvedOptions().timeZone
}

export async function computeNextRunAtMs(schedule: CronSchedule, nowMs: number): Promise<number | undefined> {
  if (schedule.kind === 'workday') {
    const time = (schedule.time ?? '18:00').trim()
    const region = (schedule.region ?? 'CN').trim()
    return computeNextWorkdayRunAtMs(region || 'CN', time || '18:00', nowMs)
  }
  if (schedule.kind === 'at') {
    const atMs = new Date(schedule.at).getTime()
    if (!Number.isFinite(atMs))
      return undefined
    return atMs > nowMs ? atMs : undefined
  }

  if (schedule.kind === 'every') {
    const everyMs = Math.max(1, Math.floor(schedule.everyMs))
    const anchor = Math.max(0, Math.floor(schedule.anchorMs ?? nowMs))
    if (nowMs < anchor)
      return anchor
    const elapsed = nowMs - anchor
    const steps = Math.max(1, Math.floor((elapsed + everyMs - 1) / everyMs))
    return anchor + steps * everyMs
  }

  // kind === 'cron'
  const expr = schedule.expr.trim()
  if (!expr)
    return undefined

  const cron = new Cron(expr, {
    timezone: resolveCronTimezone(schedule.tz),
  })
  const nowSecondMs = Math.floor(nowMs / 1000) * 1000
  const next = cron.nextRun(new Date(nowSecondMs))
  if (!next)
    return undefined

  const nextMs = next.getTime()
  return Number.isFinite(nextMs) && nextMs > nowSecondMs ? nextMs : undefined
}
