import { llm } from './modules/llm'
import { session } from './modules/session'
import { setting } from './modules/setting'
import { updater } from './modules/updater'

export const store = {
  session,
  setting,
  updater,
  llm,
}
