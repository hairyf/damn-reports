import { If, useWhenever } from '@hairy/react-lib'
import { Chip } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from 'valtio-define'
import { useUpdater } from '@/hooks/use-updater'
import { store } from '@/store'

export function UpdateStatus() {
  const { progress, downloading, autoCheckAndInstall, checkAndPromptInstall } = useUpdater()
  const { autoCheckUpdate } = useStore(store.setting)
  const { available } = useStore(store.updater)

  useWhenever(autoCheckUpdate, autoCheckAndInstall)
  useWhenever(!autoCheckUpdate && available, checkAndPromptInstall)

  return (
    <AnimatePresence>
      <If cond={downloading}>
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
