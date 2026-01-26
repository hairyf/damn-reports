import { installer } from './modules/installer'
import { setting } from './modules/setting'
import { updater } from './modules/updater'
import { user } from './modules/user'

export const store = {
  user,
  setting,
  installer,
  updater,
}
