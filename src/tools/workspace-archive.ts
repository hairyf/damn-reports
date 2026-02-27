import { invoke } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog'

/** 导出单个工具配置为 .tool 文件（zip），弹出另存为对话框。取消返回 false，成功返回 true */
export async function exportTools(toolId: string): Promise<boolean> {
  const path = await save({
    defaultPath: `${toolId}.tool`,
    filters: [{ name: 'Tool Bundle', extensions: ['tool'] }],
  })
  if (!path)
    return false
  await invoke('workspace_export_tools', { savePath: path, toolId })
  return true
}

/** 从 .tool 文件导入并合并工具配置。取消返回 false，成功返回 true */
export async function importTools(): Promise<boolean> {
  const path = await open({
    multiple: false,
    filters: [{ name: 'Tool Bundle', extensions: ['tool'] }],
  })
  if (!path || typeof path !== 'string')
    return false
  await invoke('workspace_import_tools', { zipPath: path })
  return true
}

/** 导出单个定时任务为 .cron 文件（zip）。取消返回 false，成功返回 true */
export async function exportCron(jobId: string): Promise<boolean> {
  const path = await save({
    defaultPath: `${jobId}.cron`,
    filters: [{ name: 'Cron Bundle', extensions: ['cron'] }],
  })
  if (!path)
    return false
  await invoke('workspace_export_cron', { savePath: path, jobId })
  return true
}

/** 从 .cron 文件导入并合并。取消返回 false，成功返回 true */
export async function importCron(): Promise<boolean> {
  const path = await open({
    multiple: false,
    filters: [{ name: 'Cron Bundle', extensions: ['cron'] }],
  })
  if (!path || typeof path !== 'string')
    return false
  await invoke('workspace_import_cron', { zipPath: path })
  return true
}
