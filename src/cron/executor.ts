/* eslint-disable no-console */
import type { CronJob } from './types'
import { executeCommand } from '@/utils/exec'

export interface ExecutorDeps {
  collect: () => Promise<number>
  generateReport: () => Promise<unknown>
  sendChatMessage: (message: string) => Promise<void>
}

export interface ExecuteResult {
  status: 'ok' | 'error' | 'skipped'
  error?: string
}

export async function executeJob(job: CronJob, deps: ExecutorDeps): Promise<ExecuteResult> {
  const { payload } = job

  try {
    switch (payload.kind) {
      case 'collect': {
        const count = await deps.collect()
        console.info(`[cron] job "${job.name}" collected ${count} records`)
        return { status: 'ok' }
      }
      case 'report': {
        await deps.generateReport()
        console.info(`[cron] job "${job.name}" generated report`)
        return { status: 'ok' }
      }
      case 'agentTurn': {
        await deps.sendChatMessage(payload.message)
        console.info(`[cron] job "${job.name}" sent agent message`)
        return { status: 'ok' }
      }
      case 'command': {
        const output = await executeCommand(payload.command)
        console.info(`[cron] job "${job.name}" command output:`, output)
        return { status: 'ok' }
      }
      default:
        return { status: 'skipped', error: `unknown payload kind` }
    }
  }
  catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error(`[cron] job "${job.name}" failed:`, error)
    return { status: 'error', error }
  }
}
