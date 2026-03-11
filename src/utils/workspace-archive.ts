import { addToast } from '@heroui/react'
import { invoke } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog'

/** 导入结果：导入的 id 列表与合并后的 dependencies */
export interface ImportResult {
  importedIds: string[]
  dependencies: Record<string, string>
}

/** 统一处理导入后的依赖安装与回滚逻辑 */
export async function handleImportAndInstall(options: {
  importFn: () => Promise<ImportResult | null>
  refreshFn: () => Promise<void>
  rollbackFn: (ids: string[]) => Promise<void>
  successMsg: string
}) {
  const { importFn, refreshFn, rollbackFn, successMsg } = options
  try {
    const result = await importFn()
    if (!result)
      return

    await refreshFn()

    const hasDeps = result.dependencies && Object.keys(result.dependencies).length > 0
    if (hasDeps && result.importedIds.length > 0) {
      addToast({ title: '正在安装依赖...', description: '', color: 'primary' })
      try {
        await installWorkspaceDependencies(result.dependencies)
        addToast({ title: '导入成功', description: `${successMsg}并安装依赖`, color: 'success' })
      }
      catch (err) {
        const msg = String(err)
        await rollbackFn(result.importedIds)
        if (msg.startsWith('NO_NODE:'))
          addToast({ title: '依赖未安装', description: msg.replace(/^NO_NODE:\s*/, ''), color: 'warning' })
        else
          addToast({ title: '依赖安装失败，已回滚导入', description: msg.replace(/^INSTALL_FAILED:\s*/, '').split('\n')[0], color: 'danger' })
      }
    }
    else {
      addToast({ title: '导入成功', description: `${successMsg}并刷新`, color: 'success' })
    }
  }
  catch (err) {
    addToast({ title: '导入失败', description: String(err), color: 'danger' })
  }
}

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

/** 从 .tool 文件导入并合并工具配置。取消返回 null，成功返回 ImportResult */
export async function importTools(): Promise<ImportResult | null> {
  const path = await open({
    multiple: false,
    filters: [{ name: 'Tool Bundle', extensions: ['tool'] }],
  })
  if (!path || typeof path !== 'string')
    return null
  return invoke<ImportResult>('workspace_import_tools', { zipPath: path })
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

/** 从 .cron 文件导入并合并。取消返回 null，成功返回 ImportResult */
export async function importCron(): Promise<ImportResult | null> {
  const path = await open({
    multiple: false,
    filters: [{ name: 'Cron Bundle', extensions: ['cron'] }],
  })
  if (!path || typeof path !== 'string')
    return null
  return invoke<ImportResult>('workspace_import_cron', { zipPath: path })
}

/** 在工作区安装依赖。无 node 或安装失败时抛出，错误信息含 NO_NODE: 或 INSTALL_FAILED: 供前端提示 */
export async function installWorkspaceDependencies(dependencies: Record<string, string>): Promise<void> {
  if (!Object.keys(dependencies).length)
    return
  await invoke('workspace_install_dependencies', { dependencies })
}
