import { proxy } from '@hairy/utils'
import { Store } from '@tauri-apps/plugin-store'

export const store = proxy<Store>()

Store.load('.store.dat').then(store.proxy.update)
