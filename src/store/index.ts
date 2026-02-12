import { llm } from './modules/llm'
import { session } from './modules/session'
import { setting } from './modules/setting'
import { source } from './modules/source'
import { tool } from './modules/tool'
import { updater } from './modules/updater'

export const store = {
  source,
  tool,
  session,
  setting,
  updater,
  llm,
}
