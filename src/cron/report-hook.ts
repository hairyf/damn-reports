/**
 * 日报生成后的回调钩子，用于 trigger report-end 等后续逻辑
 * 解耦 report store 与 cron service，避免循环依赖
 */
let handler: ((content: string, fromScheduled: boolean) => void) | null = null

export function setReportEndHandler(fn: ((content: string, fromScheduled: boolean) => void) | null) {
  handler = fn
}

export function notifyReportGenerated(content: string, fromScheduled: boolean) {
  handler?.(content, fromScheduled)
}
