/* eslint-disable no-console */
import type { CronJob } from './types'
import { resolveResource } from '@tauri-apps/api/path'
import { executeCommand } from '@/utils/exec'
import { remove, writeTextFile } from '@/utils/fs-extra'

export interface ExecutorDeps {
  collect: () => Promise<number>
  /** fromScheduled: 是否为定时任务触发 */
  generateReport: (fromScheduled?: boolean) => Promise<unknown>
  sendChatMessage: (message: string) => Promise<void>
}

/**
 * 执行 report-end 命令：将报告写入临时文件，以文件路径为参数调用命令
 * 最终执行：{command} "<reportPath>"
 * 脚本可通过首个参数读取报告文件路径
 */
export async function executeReportEndCommand(command: string, reportContent: string): Promise<string> {
  const workspace = await resolveResource('workspace')
  // 使用正斜杠，Node 在 Windows 上兼容
  const reportPath = `${workspace}/.report-end-${Date.now()}.md`.replace(/\\/g, '/')
  try {
    await writeTextFile(reportPath, reportContent)
    const fullCommand = `${command.trim()} "${reportPath.replace(/"/g, '\\"')}"`
    return await executeCommand(fullCommand)
  }
  finally {
    try {
      await remove(reportPath)
    }
    catch { /* ignore cleanup */ }
  }
}

export interface ExecuteResult {
  status: 'ok' | 'error' | 'skipped'
  error?: string
}

export interface ExecuteJobOptions {
  /** 是否为定时器触发（用于 report-end 的 trigger: scheduled 判断） */
  fromScheduled?: boolean
}

export async function executeJob(
  job: CronJob,
  deps: ExecutorDeps,
  options?: ExecuteJobOptions,
): Promise<ExecuteResult> {
  const { payload } = job

  try {
    switch (payload.kind) {
      case 'collect': {
        const count = await deps.collect()
        console.info(`[cron] job "${job.name}" collected ${count} records`)
        return { status: 'ok' }
      }
      case 'report': {
        await deps.generateReport(options?.fromScheduled)
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
      case 'reportEnd':
        // report-end 由 triggerReportEndJobs 触发，不在此分支执行
        return { status: 'skipped', error: 'report-end triggered by report generation' }
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
