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
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (status === StartupState.COMPLETED)
      timerRef.current = setTimeout(update, 2000)
    else
      timerRef.current = setTimeout(update, 0)

    return () => clearTimeout(timerRef.current || 0)
  }, [status])

  function renderStatus() {
    switch (status) {
      case StartupState.STARTING_SERVICE: return '依赖启动中'
      case StartupState.MANUAL_LOGIN: return '手动登录 N8N 账号'
      case StartupState.DEEPSEEK_CONFIG: return '配置 AI 密钥'
      case StartupState.INITIALIZING_ACCOUNT: return '正在加载系统账号'
      case StartupState.TEMPLATE_INIT: return '初始化工作区'
      case StartupState.COMPLETED: return '依赖运行中'
    }
  }

  function onClick() {
    if (status === StartupState.MANUAL_LOGIN || status === StartupState.DEEPSEEK_CONFIG) {
      store.setting.ininitialized = false
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          // --- 橡皮筋拖拽核心配置 ---
          drag
          dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }} // 限制拖动范围在原点，松手会触发回弹
          dragElastic={0.3} // 阻尼系数：数值越大，拉得越远，橡皮筋感越强 (0-1)
          dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }} // 回弹动画的物理属性
          whileTap={{ cursor: 'grabbing' }} // 抓取时的样式
          // -----------------------
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
          layout
          className="fixed bottom-4 right-4 z-50 cursor-pointer" // touch-none 防止移动端拖拽冲突
        >
          <Chip
            color={
              (() => {
                if (status === StartupState.MANUAL_LOGIN || status === StartupState.DEEPSEEK_CONFIG)
                  return 'danger'
                if (status === StartupState.COMPLETED)
                  return 'success'
                return 'warning'
              })()
            }
            variant="flat"
            size="sm"
            className="shadow-lg select-none" // 防止拖拽时文字被选中
            onClick={onClick}
            startContent={(
              <span className={
                clsx(
                  'relative flex w-2 h-2 rounded-full ml-1 mr-1',
                  status === StartupState.MANUAL_LOGIN || status === StartupState.DEEPSEEK_CONFIG ? 'bg-danger' : status === StartupState.COMPLETED ? 'bg-success' : 'bg-warning',
                  'after:bg-inherit after:absolute after:inset-0 after:rounded-full after:animate-ping',
                )
              }
              />
            )}
          >
            <span className="pointer-events-none">{renderStatus()}</span>
          </Chip>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
