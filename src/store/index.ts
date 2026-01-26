import { installer } from './modules/installer'
import { n8n } from './modules/n8n'
import { setting } from './modules/setting'
import { updater } from './modules/updater'

export const store = {
  n8n,
  setting,
  installer,
  updater,
}
