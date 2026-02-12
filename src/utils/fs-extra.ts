import {
  BaseDirectory,
  readDir as readDirFs,
  readFile as readFileFs,
  readTextFile as readTextFileFs,
  writeFile as writeFileFs,
  writeTextFile as writeTextFileFs,
} from '@tauri-apps/plugin-fs'
import pathe from 'pathe'

export async function readFile(path: string) {
  return readFileFs(pathe.join('workspace', path), { baseDir: BaseDirectory.Resource })
}

export async function writeFile(path: string, data: Uint8Array | ReadableStream<Uint8Array>) {
  return writeFileFs(pathe.join('workspace', path), data, { baseDir: BaseDirectory.Resource })
}

export async function readTextFile(path: string) {
  return readTextFileFs(pathe.join('workspace', path), { baseDir: BaseDirectory.Resource })
}

export async function writeTextFile(path: string, data: string) {
  return writeTextFileFs(pathe.join('workspace', path), data, { baseDir: BaseDirectory.Resource })
}

export async function readDir(path: string) {
  return readDirFs(pathe.join('workspace', path), { baseDir: BaseDirectory.Resource })
}

export async function readJson(path: string) {
  return JSON.parse(await readTextFile(path))
}

export async function writeJson(path: string, data: any) {
  return writeTextFile(path, JSON.stringify(data, null, 2))
}
