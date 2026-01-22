import type { StoreOptions } from '@tauri-apps/plugin-store'
import { proxy } from '@hairy/utils'
import { Store } from '@tauri-apps/plugin-store'
import { defineDriver } from 'unstorage'

export interface TauriStorageDriverOptions {
  path?: string
  options?: StoreOptions
}

export const tauriStorageDriver = defineDriver<TauriStorageDriverOptions | undefined, never>((options) => {
  const store = proxy<Store>()
  const path = options?.path ?? '.store.dat'
  const promise = Store.load(path, options?.options).then(store.proxy.update)

  return {
    name: 'tauri-storage',
    options,
    async hasItem(key) {
      await promise
      return store.has(key)
    },
    async getItem(key) {
      await promise
      const value = await store.get(key)
      return value
    },
    async setItem(key, value) {
      await promise
      store.set(key, value)
    },
    async removeItem(key) {
      await promise
      await store.delete(key)
    },
    async getKeys() {
      await promise
      return store.keys()
    },
    async clear() {
      await promise
      await store.clear()
    },
    async watch(callback) {
      return store.onChange(key => callback('update', key))
    },
  }
})
