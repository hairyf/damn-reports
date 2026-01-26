import { If, useWhenever } from '@hairy/react-lib'
import { Chip } from '@heroui/react'
import { useOverlay } from '@overlastic/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from 'valtio-define'
import { Modal } from './modal'

export function UpdateStatus() {
  const { isNewVersion, progress, isDownloading } = useStore(store.updater)
  const { autoCheckUpdate } = useStore(store.setting)
  const openModal = useOverlay(Modal)

  async function autoCheckAndInstall() {
    if (!await store.updater.checkAndInstall())
      return
    openModal({
      title: '新版本已就绪',
      content: '点击确认重启应用更新版本',
    })
  }

  async function manualCheckAndInstall() {
    await openModal({
      title: '检测到新版本可用',
      content: '是否安装新版本？',
    })
    await store.updater.update()
    openModal({
      title: '新版本已就绪',
      content: '点击确认重启应用更新版本',
      confirmText: '确认',
      cancelText: '暂不更新',
    })
  }

  useWhenever(autoCheckUpdate, autoCheckAndInstall)
  useWhenever(!autoCheckUpdate && isNewVersion, manualCheckAndInstall)

  return (
    <AnimatePresence>
      <If cond={isDownloading}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
        >
          <Chip
            color={progress === 100 ? 'success' : 'primary'}
            variant="flat"
            size="sm"
            className="shadow-lg"
            startContent={(
              <span className={
                `relative flex w-2 h-2 rounded-full ml-1 mr-1 ${
                  progress === 100 ? 'bg-success' : 'bg-primary'
                } ${
                  progress < 100 ? 'after:bg-inherit after:absolute after:inset-0 after:rounded-full after:animate-ping' : ''
                }`
              }
              />
            )}
          >
            <span className="pointer-events-none">
              {progress === 100 ? '更新完成' : `更新中 ${progress}%`}
            </span>
          </Chip>
        </motion.div>
      </If>
    </AnimatePresence>
  )
}
