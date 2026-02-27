import { addToast } from '@heroui/react'
import { useOverlay } from '@overlastic/react'
import { relaunch } from '@tauri-apps/plugin-process'
import { useStore } from 'valtio-define'
import { Modal } from '@/components/modal'
import { store } from '@/store'

export function useUpdater() {
  const updater = useStore(store.updater)
  const openModal = useOverlay(Modal)

  async function checkAndPromptInstall() {
    try {
      await store.updater.check()
      if (!updater.available) {
        addToast({ title: '暂无更新', description: '当前版本已是最新版' })
        return
      }
      try {
        await openModal({
          title: '检测到新版本可用',
          content: '是否安装新版本？',
          confirmText: '确认',
          cancelText: '暂不更新',
        })
      }
      catch {
        return // 用户取消，不视为更新失败
      }
      await store.updater.install()
      try {
        await openModal({
          title: '新版本已就绪',
          content: '点击确认重启应用更新版本',
        })
      }
      catch {
        return // 用户取消
      }
      await relaunch()
    }
    catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[updater] checkAndPromptInstall failed:', err)
      addToast({
        title: '更新失败',
        description: message || '请检查网络或稍后重试',
        color: 'danger',
      })
      throw err
    }
  }

  async function autoCheckAndInstall() {
    if (!await store.updater.checkAndInstall())
      return
    await openModal({
      title: '新版本已就绪',
      content: '点击确认重启应用更新版本',
    })
    await relaunch()
  }

  return {
    ...updater,
    checkAndPromptInstall,
    autoCheckAndInstall,
  }
}
