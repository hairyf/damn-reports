import { useWhenever } from '@hairy/react-lib'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Layout, PackageCheck, UserPlus, Zap } from 'lucide-react'
import { useStore } from 'valtio-define'
import { StartupState } from '@/store/modules/user'
import { Main } from './main'
import { Navbar } from './navbar'

export interface RetryOptions {
  retries?: number
  delay?: number
}

export function Initiator() {
  const { status, n8nEmail, n8nPassword } = useStore(store.user)

  async function registerN8nAccount() {
    return postN8nRegister({
      ...N8N_REGISTER_DATA,
      email: n8nEmail || N8N_REGISTER_DATA.email,
      password: n8nPassword || N8N_REGISTER_DATA.password,
    })
  }

  async function loginN8nAccount() {
    const login_data = {
      emailOrLdapLoginId: n8nEmail || N8N_REGISTER_DATA.email,
      password: n8nPassword || N8N_REGISTER_DATA.password,
    }
    return postN8nLogin(login_data)
  }

  async function initializeN8nAccount() {
    const register_data = await registerN8nAccount()
    if (typeof register_data.code !== 'number') {
      store.user.$patch({ n8nLoggedIn: true, n8nUser: register_data.data })
      return
    }

    const login_data = await loginN8nAccount()
    if (typeof login_data.code === 'number') {
      store.user.$patch({ n8nDefaultAccountLoginEnabled: false })
      throw new Error(login_data.message)
    }

    store.user.$patch({ n8nLoggedIn: true, n8nUser: login_data.data })
  }

  useWhenever(
    status === StartupState.INITIALIZING_ACCOUNT,
    () => retry(initializeN8nAccount),
    { immediate: true },
  )
  useWhenever(
    status === StartupState.TEMPLATE_INIT,
    () => retry(async () => {
    }),
    { immediate: true },
  )

  function renderStatus() {
    switch (status) {
      case StartupState.UNZIPPING:
        return (
          <StepStatus
            icon={<PackageCheck className="text-blue-400" size={32} />}
            title="解压 n8n 服务"
            description="正在准备环境组件，这可能需要一点时间..."
            progress={33}
            loading
          />
        )
      case StartupState.STARTING_SERVICE:
        return (
          <StepStatus
            icon={<Zap className="text-yellow-400" size={32} />}
            title="正在启动 n8n 服务"
            description="正在拉起后台进程与依赖服务..."
            progress={66}
            loading
          />
        )
      case StartupState.INITIALIZING_ACCOUNT:
        return (
          <StepStatus
            icon={<UserPlus className="text-emerald-400" size={32} />}
            title="n8n 服务已启动"
            description="正在初始化系统管理账号..."
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
            icon={<Layout className="text-purple-400" size={32} />}
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
