import { chat } from './modules/chat'
import { cron } from './modules/cron'
import { llm } from './modules/llm'
import { report } from './modules/report'
import { setting } from './modules/setting'
import { source } from './modules/source'
import { tool } from './modules/tool'
import { updater } from './modules/updater'

export const store = {
  source,
  tool,
  chat,
  cron,
  setting,
  llm,
  updater,
  report,
}
