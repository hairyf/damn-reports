import { invoke } from '@tauri-apps/api/core'

export interface DirEntry {
  name: string
  isDirectory: boolean
  isFile: boolean
  isSymlink: boolean
}

/** path 由 Rust 层处理：相对路径基于 workspace，绝对路径直接使用 */
export async function exists(path: string) {
  return invoke<boolean>('fs_exists', { path })
}

export async function readFile(path: string) {
  return invoke<number[]>('fs_read_file', { path }).then(bytes => Uint8Array.from(bytes))
}

export async function writeFile(path: string, data: Uint8Array | ReadableStream<Uint8Array>) {
  const bytes
    = data instanceof Uint8Array
      ? Array.from(data)
      : Array.from(new Uint8Array(await new Response(data).arrayBuffer()))
  return invoke('fs_write_file', { path, data: bytes })
}

export async function readTextFile(path: string) {
  return invoke<string>('fs_read_text_file', { path })
}

export async function writeTextFile(path: string, data: string) {
  return invoke('fs_write_text_file', { path, data })
}

export interface ReadDirOptions {
  recursive?: boolean
}

export async function readDir(path: string, options?: ReadDirOptions): Promise<DirEntry[]> {
  return invoke<DirEntry[]>('fs_read_dir', {
    path,
    recursive: options?.recursive ?? false,
  })
}

export async function remove(path: string) {
  return invoke('fs_remove', { path })
}

export interface GrepOptions {
  literal?: boolean
  ignoreCase?: boolean
  context?: number
  limit?: number
  glob?: string
}

export async function grep(
  path: string,
  pattern: string,
  options?: GrepOptions,
): Promise<string> {
  return invoke<string>('fs_grep', {
    path,
    pattern,
    options: options || undefined,
  })
}

export async function readJson(path: string) {
  return JSON.parse(await readTextFile(path))
}

export async function writeJson(path: string, data: any) {
  return writeTextFile(path, JSON.stringify(data, null, 2))
}
