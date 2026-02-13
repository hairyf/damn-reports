import { chat } from './modules/chat'
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
  setting,
  llm,
  updater,
  report,
}
