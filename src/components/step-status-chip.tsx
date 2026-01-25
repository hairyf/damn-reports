import { Chip } from '@heroui/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useStore } from 'valtio-define'
import { StartupState } from '@/store/modules/user'

export function StepStatusChip() {
  const { status } = useStore(store.user)
  const [isVisible, setIsVisible] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const update = () => setIsVisible(status !== StartupState.COMPLETED)
    // 清除之前的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    // 停留两秒后隐藏
    if (status === StartupState.COMPLETED)
      timerRef.current = setTimeout(update, 2000)
    // 其他状态时显示（使用 setTimeout 以符合 ESLint 规则）
    else
      timerRef.current = setTimeout(update, 0)

    return () => clearTimeout(timerRef.current || 0)
  }, [status])

  function renderStatus() {
    switch (status) {
      case StartupState.STARTING_SERVICE:
        return '依赖启动中'
      case StartupState.INITIALIZING_ACCOUNT:
        return '正在加载系统账号'
      case StartupState.TEMPLATE_INIT:
        return '初始化工作区'
      case StartupState.COMPLETED:
        return '依赖运行中'
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          layout
          className="fixed bottom-4 right-4 z-50"
        >
          <Chip
            color={status !== StartupState.COMPLETED ? 'warning' : 'success'}
            variant="flat"
            size="sm"
            className="shadow-lg"
            startContent={(
              <span className={
                clsx(
                  'relative flex w-2 h-2 rounded-full ml-1 mr-1',
                  status !== StartupState.COMPLETED ? 'bg-warning' : 'bg-success',
                  'after:bg-inherit after:absolute after:inset-0 after:rounded-full after:animate-ping',
                )
              }
              />
            )}
          >
            <span>{renderStatus()}</span>
          </Chip>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
