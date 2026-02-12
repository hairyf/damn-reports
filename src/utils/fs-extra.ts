import { BaseDirectory, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import pathe from 'pathe'

export async function readJson(path: string) {
  return JSON.parse(await readTextFile(
    pathe.join('workspace', path),
    { baseDir: BaseDirectory.Resource },
  ))
}

export async function writeJson(path: string, data: any) {
  return writeTextFile(
    pathe.join('workspace', path),
    JSON.stringify(data, null, 2),
    { baseDir: BaseDirectory.Resource },
  )
}

export * from '@tauri-apps/plugin-fs'
