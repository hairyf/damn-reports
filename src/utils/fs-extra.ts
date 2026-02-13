import type { DirEntry } from '@tauri-apps/plugin-fs'
import fs from 'node:fs'
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
  const filePath = pathe.join('workspace', path)
  return readTextFileFs(filePath, { baseDir: BaseDirectory.Resource })
}

export async function writeTextFile(path: string, data: string) {
  return writeTextFileFs(pathe.join('workspace', path), data, { baseDir: BaseDirectory.Resource })
}

export interface ReadDirOptions {
  /** 为 true 时递归列出所有文件路径（相对 workspace），仅包含文件不包含目录 */
  recursive?: boolean
}

export async function readDir(path: string, options?: ReadDirOptions): Promise<DirEntry[]> {
  const fullPath = pathe.join('workspace', path)
  if (options?.recursive) {
    const result: DirEntry[] = []
    const entries = await readDirFs(fullPath, { baseDir: BaseDirectory.Resource })
    for (const e of entries) {
      const childPath = path ? `${path}/${e.name}` : e.name
      result.push({ name: childPath, isDirectory: e.isDirectory, isFile: e.isFile, isSymlink: e.isSymlink })
      if (e.isDirectory) {
        result.push(...(await readDir(childPath, { recursive: true })))
      }
    }
    return result
  }
  return readDirFs(fullPath, { baseDir: BaseDirectory.Resource })
}

export async function readJson(path: string) {
  return JSON.parse(await readTextFile(path))
}

export async function writeJson(path: string, data: any) {
  return writeTextFile(path, JSON.stringify(data, null, 2))
}
