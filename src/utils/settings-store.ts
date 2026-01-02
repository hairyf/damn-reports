import { Store } from '@tauri-apps/plugin-store'

let store: Store | null = null

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load('.settings.dat')
  }
  return store
}

export type ThemeMode = 'light' | 'dark' | 'system'
export type Language = 'zh-CN' | 'en-US'

export interface AppSettings {
  theme: ThemeMode
  language: Language
  autoSave: boolean
  notifications: boolean
  autoCheckUpdate: boolean
}

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'zh-CN',
  autoSave: true,
  notifications: true,
  autoCheckUpdate: true,
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const storeInstance = await getStore()
    const settings = await storeInstance.get<AppSettings>('settings')
    return settings || defaultSettings
  }
  catch (error) {
    console.error('Failed to load settings:', error)
    return defaultSettings
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    const storeInstance = await getStore()
    const currentSettings = await getSettings()
    const newSettings = { ...currentSettings, ...settings }
    await storeInstance.set('settings', newSettings)
    await storeInstance.save()
  }
  catch (error) {
    console.error('Failed to save settings:', error)
  }
}

export async function getSetting<K extends keyof AppSettings>(
  key: K,
): Promise<AppSettings[K]> {
  const settings = await getSettings()
  return settings[key]
}

export async function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K],
): Promise<void> {
  await saveSettings({ [key]: value })
}
