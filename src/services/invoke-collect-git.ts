import { invoke } from '@tauri-apps/api/core'

export interface InvokeCollectGitParams {
  repository: string
  branch: string
  author: string
}

export interface GitCommit {
  id: string
  message: string
  author: string
  date: string
  files: FileDiff[]
  insertions: number
  deletions: number
}

export interface FileDiff {
  path: string
  status: string
  insertions: number
  deletions: number
  patch: string
}

export interface InvokeCollectGitResult {
  data: GitCommit[]
  count: number
}

export function invokeCollectGit(params: InvokeCollectGitParams) {
  return invoke<InvokeCollectGitResult>('daily', params as unknown as Record<string, unknown>)
}
