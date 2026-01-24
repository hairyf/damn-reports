import { useWhenever } from '@hairy/react-lib'
import { Icon } from '@iconify/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from 'valtio-define'
import { StartupState } from '@/store/modules/user'
import { Main } from './main'
import { Navbar } from './navbar'

export interface RetryOptions {
  retries?: number
  delay?: number
}

export function Initiator() {
  const { status } = useStore(store.user)

  useWhenever(
    status === StartupState.INITIALIZING_ACCOUNT,
    // 登录重试多一些，避免启动 n8n 端口还未完全启动成功
    () => retry(store.user.initializeAccount, { retries: 10, delay: 1000 }),
    { immediate: true },
  )

  useWhenever(
    status === StartupState.TEMPLATE_INIT,
    () => retry(store.user.initializeWorkflow),
    { immediate: true },
  )

  function renderStatus() {
    switch (status) {
      case StartupState.STARTING_SERVICE:
        return (
          <StepStatus
            icon={<Icon icon="lucide:zap" className="text-yellow-400 w-8 h-8" />}
            title="正在启动 n8n 服务"
            description="正在拉起后台进程与依赖服务..."
            progress={66}
            loading
          />
        )
      case StartupState.INITIALIZING_ACCOUNT:
        return (
          <StepStatus
            icon={<Icon icon="lucide:user-plus" className="text-emerald-400 w-8 h-8" />}
            title="n8n 服务已启动"
            description="正在加载系统账号..."
            progress={90}
            loading
          />
        )
      case StartupState.MANUAL_LOGIN:
        return (
          <StepN8nManualLogin />
        )
      case StartupState.DEEPSEEK_CONFIG:
        return (
          <StepDeepSeekApiKey />
        )
      case StartupState.TEMPLATE_INIT:
        return (
          <StepStatus
            icon={<Icon icon="lucide:layout" className="text-purple-400 w-8 h-8" />}
            title="账号初始化成功"
            description="工作区资源初始化，正在加载自动化任务模版..."
            progress={95}
            loading
          />
        )
      default:
        return null
    }
  }

  return (
    <div className={clsx('relative flex min-h-screen border-none')}>
      <div className="flex flex-col flex-1">
        <Navbar />
        <Main className="flex justify-center items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              className="w-full max-w-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              {renderStatus()}
            </motion.div>
          </AnimatePresence>
        </Main>
      </div>
    </div>
  )
}
