/**
 * 日报生成后的回调钩子，用于 trigger report-end 等后续逻辑
 * 解耦 report store 与 cron service，避免循环依赖
 * 使用 mitt 处理事件订阅，支持多个监听方
 */
import mitt from 'mitt'

export interface ReportGeneratedPayload { content: string, fromScheduled: boolean }

type ReportEvents = {
  'report-generated': ReportGeneratedPayload
} & Record<string | symbol, unknown>

const reportEmitter = mitt<ReportEvents>()

/** 订阅日报生成事件 */
export function onReportGenerated(handler: (payload: ReportGeneratedPayload) => void) {
  reportEmitter.on('report-generated', handler)
}

/** 取消订阅日报生成事件 */
export function offReportGenerated(handler: (payload: ReportGeneratedPayload) => void) {
  reportEmitter.off('report-generated', handler)
}

/** 通知日报已生成（由 report store 调用） */
export function notifyReportGenerated(content: string, fromScheduled: boolean) {
  reportEmitter.emit('report-generated', { content, fromScheduled })
}
