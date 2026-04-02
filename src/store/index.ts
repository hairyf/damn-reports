import { agent } from './modules/agent'
import { cron } from './modules/cron'
import { report } from './modules/report'
import { session } from './modules/session'
import { setting } from './modules/setting'
import { source } from './modules/source'
import { tool } from './modules/tool'
import { updater } from './modules/updater'

export const store = {
  source,
  tool,
  session,
  cron,
  setting,
  agent,
  updater,
  report,
}
