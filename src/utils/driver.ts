import { defineDriver } from 'unstorage'

async function fetchServerStorage(method: string, params: any[] = []) {
  return fetch(`/api/storage`, { body: JSON.stringify({ method, params }), method: 'POST' }).then(res => res.json())
}

export const nextFsClientDriver = defineDriver(() => ({
  name: 'next-fs-storage',
  async hasItem(key) {
    return fetchServerStorage('hasItem', [key])
  },
  async getItem(key) {
    return fetchServerStorage('getItem', [key])
  },
  async setItem(key, value) {
    return fetchServerStorage('setItem', [key, value])
  },
  async removeItem(key) {
    return fetchServerStorage('removeItem', [key])
  },
  async getKeys() {
    return Array.from(await fetchServerStorage('getKeys'))
  },
  async clear() {
    return fetchServerStorage('clear')
  },
}))
